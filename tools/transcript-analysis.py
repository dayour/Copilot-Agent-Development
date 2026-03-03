#!/usr/bin/env python3
"""
transcript-analysis.py

Conversation transcript analysis pipeline for Copilot Studio agents.

Consumes a Copilot Studio analytics export (CSV or JSON) or a Dataverse
conversation log export and produces a weekly analysis report covering:

  1. Unrecognized Intent Clustering  -- groups fallback turns by intent pattern
  2. Topic Confusion Matrix          -- identifies routing pairs that go wrong
  3. Knowledge Gap Detection         -- finds queries with no knowledge results
  4. Sentiment Drift                 -- detects conversations where sentiment degrades
  5. Escalation Pattern Analysis     -- identifies paths leading to human handoff
  6. Response Quality Sampling       -- LLM-judge scored random sample for quality trends

Usage:
    python transcript-analysis.py --input transcripts.csv
    python transcript-analysis.py --input transcripts.json --format json
    python transcript-analysis.py --input transcripts.csv --output report.md
    python transcript-analysis.py --input transcripts.csv --output report.json --report-format json
    python transcript-analysis.py --input transcripts.csv --retention-days 30

Privacy:
    Output contains conversation IDs only -- no user identifiers or PII.
    Transcripts older than --retention-days (default 90) are excluded.
    User-message text is never written to output; only aggregate patterns are.

Exit codes:
    0  Report generated successfully
    1  Input file error or no usable records
    2  Configuration or argument error
"""

import argparse
import collections
import csv
import hashlib
import io
import json
import math
import os
import random
import re
import sys
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

DEFAULT_RETENTION_DAYS = 90
DEFAULT_SAMPLE_SIZE = 50
DEFAULT_CLUSTER_SIMILARITY_THRESHOLD = 0.30
DEFAULT_SENTIMENT_DRIFT_THRESHOLD = -0.40
MIN_CLUSTER_SIZE = 2
ESCALATION_KEYWORDS = frozenset([
    "human", "agent", "person", "representative", "escalate", "transfer",
    "speak to", "talk to", "connect me", "live agent", "support team",
    "help desk", "call me", "callback",
])
NEGATIVE_SENTIMENT_WORDS = frozenset([
    "frustrated", "angry", "unhappy", "terrible", "awful", "horrible",
    "useless", "broken", "wrong", "failed", "not working", "disappointed",
    "confused", "lost", "stuck", "error", "problem", "issue", "bad",
    "worse", "worst", "hate", "ridiculous", "unacceptable",
])
POSITIVE_SENTIMENT_WORDS = frozenset([
    "thanks", "thank you", "great", "excellent", "perfect", "helpful",
    "good", "wonderful", "amazing", "fantastic", "love", "appreciate",
    "solved", "fixed", "working", "done", "resolved", "clear",
])
KNOWLEDGE_GAP_MARKERS = frozenset([
    "no results", "couldn't find", "no information", "not found",
    "i don't know", "i'm not sure", "i couldn't locate", "no match",
    "nothing found", "no relevant", "i was unable",
])
FALLBACK_MARKERS = frozenset([
    "i didn't understand", "i'm sorry, i didn't", "could you rephrase",
    "i couldn't understand", "i'm not sure what you mean",
    "sorry, i don't understand", "fallback", "unrecognized",
    "i didn't catch", "didn't quite understand",
])


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class ConversationTurn:
    conversation_id: str
    turn_index: int
    timestamp: Optional[datetime]
    speaker: str          # "user" or "agent"
    text: str
    topic_triggered: str
    intent_score: float
    is_fallback: bool
    is_escalation: bool
    knowledge_result_count: int  # -1 = not a knowledge query turn


@dataclass
class Conversation:
    conversation_id: str
    agent_name: str
    vertical: str
    started_at: Optional[datetime]
    turns: List[ConversationTurn] = field(default_factory=list)


@dataclass
class IntentCluster:
    cluster_id: str
    size: int
    representative_turn_hash: str  # SHA-256 of cleaned text (privacy safe)
    common_terms: List[str]
    conversation_ids: List[str]


@dataclass
class ConfusionPair:
    intended_topic: str
    actual_topic: str
    count: int
    example_conversation_ids: List[str]


@dataclass
class KnowledgeGap:
    query_hash: str          # SHA-256 of normalized query (no raw text in output)
    common_terms: List[str]
    occurrence_count: int
    conversation_ids: List[str]


@dataclass
class SentimentDriftConversation:
    conversation_id: str
    opening_sentiment: float
    closing_sentiment: float
    drift_delta: float
    turn_count: int


@dataclass
class EscalationPath:
    path_signature: str      # topic sequence leading to escalation (colon-joined)
    count: int
    example_conversation_ids: List[str]


@dataclass
class QualitySample:
    conversation_id: str
    turn_count: int
    fallback_rate: float
    knowledge_hit_rate: float
    escalated: bool
    quality_score: float     # heuristic 0-1 (LLM judge placeholder)
    quality_notes: str


@dataclass
class AnalysisReport:
    generated_at: str
    period_start: str
    period_end: str
    total_conversations: int
    total_turns: int
    retention_days: int
    intent_clusters: List[IntentCluster]
    confusion_pairs: List[ConfusionPair]
    knowledge_gaps: List[KnowledgeGap]
    sentiment_drift_conversations: List[SentimentDriftConversation]
    escalation_paths: List[EscalationPath]
    quality_samples: List[QualitySample]
    recommendations: List[str]


# ---------------------------------------------------------------------------
# Input parsing
# ---------------------------------------------------------------------------

# Expected column names for CSV / JSON fields, with common aliases resolved.
_FIELD_ALIASES: Dict[str, List[str]] = {
    "conversation_id":        ["conversation_id", "conversationid", "conv_id", "sessionid", "session_id"],
    "agent_name":             ["agent_name", "agentname", "bot_name", "botname"],
    "vertical":               ["vertical", "channel", "product"],
    "turn_index":             ["turn_index", "turnindex", "turn_number", "turn_num"],
    "timestamp":              ["timestamp", "created_at", "createdat", "time", "date"],
    "speaker":                ["speaker", "role", "from", "sender"],
    "text":                   ["text", "message", "utterance", "content", "body"],
    "topic_triggered":        ["topic_triggered", "topic", "intent", "dialog", "dialog_name"],
    "intent_score":           ["intent_score", "confidence", "score", "intent_confidence"],
    "is_fallback":            ["is_fallback", "fallback", "unrecognized"],
    "is_escalation":          ["is_escalation", "escalation", "handoff", "human_handoff"],
    "knowledge_result_count": ["knowledge_result_count", "search_result_count", "results_count"],
}


def _resolve_field(row: dict, canonical: str) -> Optional[str]:
    """Return the value for a canonical field by checking all aliases."""
    for alias in _FIELD_ALIASES.get(canonical, [canonical]):
        if alias in row:
            return str(row[alias]) if row[alias] is not None else None
    return None


def _parse_bool(value: Optional[str]) -> bool:
    if value is None:
        return False
    return value.strip().lower() in ("1", "true", "yes", "y")


def _parse_float(value: Optional[str], default: float = 0.0) -> float:
    try:
        return float(value) if value is not None else default
    except (ValueError, TypeError):
        return default


def _parse_int(value: Optional[str], default: int = 0) -> int:
    try:
        return int(value) if value is not None else default
    except (ValueError, TypeError):
        return default


def _parse_timestamp(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    for fmt in (
        "%Y-%m-%dT%H:%M:%S.%fZ",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
    ):
        try:
            dt = datetime.strptime(value.strip(), fmt)
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


def _auto_detect_fallback(text: str) -> bool:
    lower = text.lower()
    return any(marker in lower for marker in FALLBACK_MARKERS)


def _auto_detect_escalation(text: str) -> bool:
    lower = text.lower()
    return any(kw in lower for kw in ESCALATION_KEYWORDS)


def _row_to_turn(row: dict, row_index: int) -> Optional[ConversationTurn]:
    conversation_id = _resolve_field(row, "conversation_id")
    if not conversation_id:
        return None
    text = _resolve_field(row, "text") or ""
    is_fallback_raw = _resolve_field(row, "is_fallback")
    is_escalation_raw = _resolve_field(row, "is_escalation")
    return ConversationTurn(
        conversation_id=conversation_id.strip(),
        turn_index=_parse_int(_resolve_field(row, "turn_index"), row_index),
        timestamp=_parse_timestamp(_resolve_field(row, "timestamp")),
        speaker=(_resolve_field(row, "speaker") or "unknown").strip().lower(),
        text=text,
        topic_triggered=(_resolve_field(row, "topic_triggered") or "").strip(),
        intent_score=_parse_float(_resolve_field(row, "intent_score")),
        is_fallback=(
            _parse_bool(is_fallback_raw) if is_fallback_raw is not None
            else _auto_detect_fallback(text)
        ),
        is_escalation=(
            _parse_bool(is_escalation_raw) if is_escalation_raw is not None
            else _auto_detect_escalation(text)
        ),
        knowledge_result_count=_parse_int(_resolve_field(row, "knowledge_result_count"), -1),
    )


def load_csv(path: str) -> List[ConversationTurn]:
    turns = []
    with open(path, newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        for i, row in enumerate(reader):
            turn = _row_to_turn(row, i)
            if turn:
                turns.append(turn)
    return turns


def load_json(path: str) -> List[ConversationTurn]:
    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)
    turns = []
    # Support both a flat array and {"conversations": [...]} envelope
    if isinstance(data, list):
        rows = data
    elif isinstance(data, dict):
        rows = data.get("conversations", data.get("turns", data.get("records", [])))
    else:
        rows = []
    for i, row in enumerate(rows):
        if isinstance(row, dict):
            turn = _row_to_turn(row, i)
            if turn:
                turns.append(turn)
    return turns


def group_conversations(
    turns: List[ConversationTurn],
    cutoff: datetime,
) -> Dict[str, Conversation]:
    """Group turns into Conversation objects, applying the retention cutoff."""
    conversations: Dict[str, Conversation] = {}
    for turn in turns:
        # Apply retention filter on turn timestamp when available
        if turn.timestamp and turn.timestamp < cutoff:
            continue
        cid = turn.conversation_id
        if cid not in conversations:
            conversations[cid] = Conversation(
                conversation_id=cid,
                agent_name="",
                vertical="",
                started_at=turn.timestamp,
            )
        conv = conversations[cid]
        conv.turns.append(turn)
        if turn.timestamp and (conv.started_at is None or turn.timestamp < conv.started_at):
            conv.started_at = turn.timestamp
    # Sort turns within each conversation
    for conv in conversations.values():
        conv.turns.sort(key=lambda t: t.turn_index)
    return conversations


# ---------------------------------------------------------------------------
# Text utilities (no external dependencies)
# ---------------------------------------------------------------------------

_STOPWORDS = frozenset([
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "it", "i", "my", "me", "we", "you",
    "your", "can", "do", "did", "was", "are", "be", "been", "being",
    "have", "has", "had", "that", "this", "what", "how", "when", "where",
    "which", "who", "will", "would", "could", "should", "please", "just",
    "not", "no", "yes", "ok", "okay", "hi", "hello", "hey",
])


def _tokenize(text: str) -> List[str]:
    """Lower-case, strip punctuation, return non-stopword tokens."""
    tokens = re.findall(r"[a-z]+", text.lower())
    return [t for t in tokens if t not in _STOPWORDS and len(t) > 2]


def _term_vector(tokens: List[str]) -> Dict[str, int]:
    counts: Dict[str, int] = collections.defaultdict(int)
    for t in tokens:
        counts[t] += 1
    return dict(counts)


def _cosine_similarity(a: Dict[str, int], b: Dict[str, int]) -> float:
    if not a or not b:
        return 0.0
    dot = sum(a.get(t, 0) * b.get(t, 0) for t in a)
    mag_a = math.sqrt(sum(v * v for v in a.values()))
    mag_b = math.sqrt(sum(v * v for v in b.values()))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def _text_hash(text: str) -> str:
    """Return a short privacy-safe hash of normalized text."""
    normalized = " ".join(sorted(_tokenize(text)))
    return hashlib.sha256(normalized.encode()).hexdigest()[:12]


def _top_terms(texts: List[str], top_n: int = 5) -> List[str]:
    """Return the top-N most frequent non-stopword tokens across texts."""
    counts: Dict[str, int] = collections.defaultdict(int)
    for text in texts:
        for token in _tokenize(text):
            counts[token] += 1
    return [t for t, _ in sorted(counts.items(), key=lambda x: -x[1])[:top_n]]


def _score_sentiment(text: str) -> float:
    """
    Return a naive sentiment score in [-1, +1].
    Negative words contribute -0.1 each, positive +0.1 each, capped at bounds.
    """
    tokens = set(re.findall(r"[a-z]+", text.lower()))
    neg = len(tokens & NEGATIVE_SENTIMENT_WORDS)
    pos = len(tokens & POSITIVE_SENTIMENT_WORDS)
    score = (pos - neg) * 0.1
    return max(-1.0, min(1.0, score))


# ---------------------------------------------------------------------------
# Analysis: 1. Unrecognized Intent Clustering
# ---------------------------------------------------------------------------

def analyze_intent_clusters(
    conversations: Dict[str, Conversation],
    similarity_threshold: float = DEFAULT_CLUSTER_SIMILARITY_THRESHOLD,
) -> List[IntentCluster]:
    """
    Group fallback turns by token-overlap similarity to surface missing topics.
    Uses single-pass greedy clustering: assign each fallback turn to the first
    cluster whose centroid cosine-similarity exceeds the threshold.
    """
    fallback_turns: List[Tuple[str, str]] = []  # (conversation_id, text)
    for conv in conversations.values():
        for turn in conv.turns:
            if turn.is_fallback and turn.speaker == "user" and turn.text.strip():
                fallback_turns.append((conv.conversation_id, turn.text))

    if not fallback_turns:
        return []

    # clusters[i] = {"centroid": dict, "members": [(conv_id, text)]}
    clusters: List[dict] = []
    for conv_id, text in fallback_turns:
        vec = _term_vector(_tokenize(text))
        best_idx = -1
        best_sim = 0.0
        for idx, cluster in enumerate(clusters):
            sim = _cosine_similarity(vec, cluster["centroid"])
            if sim > best_sim:
                best_sim = sim
                best_idx = idx
        if best_sim >= similarity_threshold and best_idx >= 0:
            clusters[best_idx]["members"].append((conv_id, text))
            # Update centroid as sum of term vectors
            for term, count in vec.items():
                clusters[best_idx]["centroid"][term] = (
                    clusters[best_idx]["centroid"].get(term, 0) + count
                )
        else:
            clusters.append({"centroid": dict(vec), "members": [(conv_id, text)]})

    result = []
    for i, cluster in enumerate(clusters):
        if len(cluster["members"]) < MIN_CLUSTER_SIZE:
            continue
        texts = [m[1] for m in cluster["members"]]
        conv_ids = list({m[0] for m in cluster["members"]})
        result.append(IntentCluster(
            cluster_id=f"IC-{i + 1:03d}",
            size=len(cluster["members"]),
            representative_turn_hash=_text_hash(texts[0]),
            common_terms=_top_terms(texts),
            conversation_ids=conv_ids[:10],  # cap at 10 for report brevity
        ))

    result.sort(key=lambda c: -c.size)
    return result


# ---------------------------------------------------------------------------
# Analysis: 2. Topic Confusion Matrix
# ---------------------------------------------------------------------------

def analyze_topic_confusion(
    conversations: Dict[str, Conversation],
) -> List[ConfusionPair]:
    """
    Identify topic pairs where routing frequently goes wrong.
    A confusion event is a fallback turn that immediately follows a routed
    turn, suggesting the previous topic routing led the user to retry.
    """
    pair_counts: Dict[Tuple[str, str], List[str]] = collections.defaultdict(list)

    for conv in conversations.values():
        turns = [t for t in conv.turns if t.topic_triggered]
        for i in range(1, len(turns)):
            prev = turns[i - 1]
            curr = turns[i]
            if curr.is_fallback and prev.topic_triggered and prev.topic_triggered != curr.topic_triggered:
                pair = (prev.topic_triggered, curr.topic_triggered or "Fallback")
                pair_counts[pair].append(conv.conversation_id)

    result = []
    for (intended, actual), conv_ids in pair_counts.items():
        if len(conv_ids) < MIN_CLUSTER_SIZE:
            continue
        result.append(ConfusionPair(
            intended_topic=intended,
            actual_topic=actual,
            count=len(conv_ids),
            example_conversation_ids=list(set(conv_ids))[:5],
        ))

    result.sort(key=lambda p: -p.count)
    return result


# ---------------------------------------------------------------------------
# Analysis: 3. Knowledge Gap Detection
# ---------------------------------------------------------------------------

def analyze_knowledge_gaps(
    conversations: Dict[str, Conversation],
    similarity_threshold: float = DEFAULT_CLUSTER_SIMILARITY_THRESHOLD,
) -> List[KnowledgeGap]:
    """
    Find user queries where knowledge sources return no results.
    No-result turns are clustered by token similarity to surface recurring gaps.
    """
    gap_turns: List[Tuple[str, str]] = []  # (conv_id, user_text)

    for conv in conversations.values():
        turns = conv.turns
        for i, turn in enumerate(turns):
            # A knowledge gap is indicated by:
            #   - agent turn with KNOWLEDGE_GAP_MARKERS text, or
            #   - knowledge_result_count == 0
            if turn.speaker == "agent" and (
                turn.knowledge_result_count == 0
                or any(m in turn.text.lower() for m in KNOWLEDGE_GAP_MARKERS)
            ):
                # Attribute to the preceding user turn
                user_text = ""
                for j in range(i - 1, -1, -1):
                    if turns[j].speaker == "user":
                        user_text = turns[j].text
                        break
                if user_text.strip():
                    gap_turns.append((conv.conversation_id, user_text))

    if not gap_turns:
        return []

    # Cluster gap turns by similarity
    clusters: List[dict] = []
    for conv_id, text in gap_turns:
        vec = _term_vector(_tokenize(text))
        best_idx = -1
        best_sim = 0.0
        for idx, cluster in enumerate(clusters):
            sim = _cosine_similarity(vec, cluster["centroid"])
            if sim > best_sim:
                best_sim = sim
                best_idx = idx
        if best_sim >= similarity_threshold and best_idx >= 0:
            clusters[best_idx]["members"].append((conv_id, text))
            for term, count in vec.items():
                clusters[best_idx]["centroid"][term] = (
                    clusters[best_idx]["centroid"].get(term, 0) + count
                )
        else:
            clusters.append({"centroid": dict(vec), "members": [(conv_id, text)]})

    result = []
    for i, cluster in enumerate(clusters):
        if len(cluster["members"]) < MIN_CLUSTER_SIZE:
            continue
        texts = [m[1] for m in cluster["members"]]
        conv_ids = list({m[0] for m in cluster["members"]})
        result.append(KnowledgeGap(
            query_hash=_text_hash(texts[0]),
            common_terms=_top_terms(texts),
            occurrence_count=len(cluster["members"]),
            conversation_ids=conv_ids[:10],
        ))

    result.sort(key=lambda g: -g.occurrence_count)
    return result


# ---------------------------------------------------------------------------
# Analysis: 4. Sentiment Drift
# ---------------------------------------------------------------------------

def analyze_sentiment_drift(
    conversations: Dict[str, Conversation],
    drift_threshold: float = DEFAULT_SENTIMENT_DRIFT_THRESHOLD,
) -> List[SentimentDriftConversation]:
    """
    Detect conversations where user sentiment degrades significantly over turns.
    Opening sentiment = avg of first 2 user turns.
    Closing sentiment = avg of last 2 user turns.
    Drift delta = closing - opening; negative indicates degradation.
    """
    result = []
    for conv in conversations.values():
        user_turns = [t for t in conv.turns if t.speaker == "user" and t.text.strip()]
        if len(user_turns) < 3:
            continue

        opening_texts = user_turns[:2]
        closing_texts = user_turns[-2:]
        opening_score = sum(_score_sentiment(t.text) for t in opening_texts) / len(opening_texts)
        closing_score = sum(_score_sentiment(t.text) for t in closing_texts) / len(closing_texts)
        delta = closing_score - opening_score

        if delta <= drift_threshold:
            result.append(SentimentDriftConversation(
                conversation_id=conv.conversation_id,
                opening_sentiment=round(opening_score, 3),
                closing_sentiment=round(closing_score, 3),
                drift_delta=round(delta, 3),
                turn_count=len(conv.turns),
            ))

    result.sort(key=lambda c: c.drift_delta)
    return result


# ---------------------------------------------------------------------------
# Analysis: 5. Escalation Pattern Analysis
# ---------------------------------------------------------------------------

def analyze_escalation_paths(
    conversations: Dict[str, Conversation],
) -> List[EscalationPath]:
    """
    Identify the most common topic sequences leading to human handoff.
    Path = colon-joined ordered topic list up to and including the escalation turn.
    """
    path_counts: Dict[str, List[str]] = collections.defaultdict(list)

    for conv in conversations.values():
        escalation_idx = -1
        for i, turn in enumerate(conv.turns):
            if turn.is_escalation:
                escalation_idx = i
                break
        if escalation_idx < 0:
            continue

        # Collect distinct topics before (and including) the escalation
        topics = []
        seen = set()
        for turn in conv.turns[:escalation_idx + 1]:
            if turn.topic_triggered and turn.topic_triggered not in seen:
                topics.append(turn.topic_triggered)
                seen.add(turn.topic_triggered)

        if not topics:
            continue

        signature = " > ".join(topics)
        path_counts[signature].append(conv.conversation_id)

    result = []
    for signature, conv_ids in path_counts.items():
        if len(conv_ids) < MIN_CLUSTER_SIZE:
            continue
        result.append(EscalationPath(
            path_signature=signature,
            count=len(conv_ids),
            example_conversation_ids=list(set(conv_ids))[:5],
        ))

    result.sort(key=lambda p: -p.count)
    return result


# ---------------------------------------------------------------------------
# Analysis: 6. Response Quality Sampling
# ---------------------------------------------------------------------------

def _heuristic_quality_score(conv: Conversation) -> Tuple[float, str]:
    """
    Compute a heuristic quality score (0-1) for a conversation.
    In production, replace this function with an LLM judge call.
    Scoring factors:
      - Fallback rate (lower is better)
      - Knowledge hit rate (higher is better)
      - Escalation penalty
      - Sentiment at close
    Returns (score, notes_string).
    """
    user_turns = [t for t in conv.turns if t.speaker == "user"]
    agent_turns = [t for t in conv.turns if t.speaker == "agent"]
    total_turns = max(len(conv.turns), 1)

    if not user_turns:
        return 0.5, "No user turns"

    fallback_count = sum(1 for t in conv.turns if t.is_fallback)
    fallback_rate = fallback_count / total_turns

    knowledge_turns = [t for t in agent_turns if t.knowledge_result_count >= 0]
    knowledge_hits = sum(1 for t in knowledge_turns if t.knowledge_result_count > 0)
    knowledge_hit_rate = (knowledge_hits / len(knowledge_turns)) if knowledge_turns else 1.0

    escalated = any(t.is_escalation for t in conv.turns)
    closing_sentiment = _score_sentiment(user_turns[-1].text) if user_turns else 0.0

    score = 1.0
    score -= fallback_rate * 0.4
    score -= (1.0 - knowledge_hit_rate) * 0.2
    if escalated:
        score -= 0.2
    score += closing_sentiment * 0.1
    score = max(0.0, min(1.0, score))

    notes_parts = []
    if fallback_rate > 0.3:
        notes_parts.append(f"high fallback rate ({fallback_rate:.0%})")
    if knowledge_hit_rate < 0.5 and knowledge_turns:
        notes_parts.append(f"low knowledge hit rate ({knowledge_hit_rate:.0%})")
    if escalated:
        notes_parts.append("escalated to human")
    if closing_sentiment < -0.2:
        notes_parts.append("negative closing sentiment")
    notes = "; ".join(notes_parts) if notes_parts else "no issues detected"
    return round(score, 3), notes


def analyze_quality_samples(
    conversations: Dict[str, Conversation],
    sample_size: int = DEFAULT_SAMPLE_SIZE,
    seed: Optional[int] = None,
) -> List[QualitySample]:
    """
    Random sample of conversations scored by heuristic quality judge.
    In production, replace _heuristic_quality_score with an LLM-judge call.
    """
    all_convs = list(conversations.values())
    rng = random.Random(seed)
    sample = rng.sample(all_convs, min(sample_size, len(all_convs)))

    result = []
    for conv in sample:
        user_turns = [t for t in conv.turns if t.speaker == "user"]
        agent_turns = [t for t in conv.turns if t.speaker == "agent"]
        total_turns = max(len(conv.turns), 1)

        fallback_count = sum(1 for t in conv.turns if t.is_fallback)
        fallback_rate = fallback_count / total_turns

        knowledge_turns = [t for t in agent_turns if t.knowledge_result_count >= 0]
        knowledge_hits = sum(1 for t in knowledge_turns if t.knowledge_result_count > 0)
        knowledge_hit_rate = (knowledge_hits / len(knowledge_turns)) if knowledge_turns else 1.0

        escalated = any(t.is_escalation for t in conv.turns)
        score, notes = _heuristic_quality_score(conv)

        result.append(QualitySample(
            conversation_id=conv.conversation_id,
            turn_count=len(conv.turns),
            fallback_rate=round(fallback_rate, 3),
            knowledge_hit_rate=round(knowledge_hit_rate, 3),
            escalated=escalated,
            quality_score=score,
            quality_notes=notes,
        ))

    result.sort(key=lambda s: s.quality_score)
    return result


# ---------------------------------------------------------------------------
# Recommendations engine
# ---------------------------------------------------------------------------

def generate_recommendations(
    report: AnalysisReport,
) -> List[str]:
    """Derive actionable recommendations from the analysis results."""
    recs = []

    # Intent clusters -> add topics
    if report.intent_clusters:
        top = report.intent_clusters[:3]
        for cluster in top:
            terms = ", ".join(cluster.common_terms[:3]) if cluster.common_terms else "unknown"
            recs.append(
                f"Add a new topic covering intent pattern [{terms}] "
                f"(cluster {cluster.cluster_id}, {cluster.size} occurrences)."
            )

    # Confusion pairs -> review topic routing
    if report.confusion_pairs:
        top = report.confusion_pairs[:3]
        for pair in top:
            recs.append(
                f"Review trigger phrases for topic '{pair.intended_topic}': "
                f"{pair.count} conversations routed to '{pair.actual_topic}' instead."
            )

    # Knowledge gaps -> expand knowledge sources
    if report.knowledge_gaps:
        top = report.knowledge_gaps[:3]
        for gap in top:
            terms = ", ".join(gap.common_terms[:3]) if gap.common_terms else "unknown"
            recs.append(
                f"Expand knowledge sources to cover queries about [{terms}] "
                f"({gap.occurrence_count} unanswered queries)."
            )

    # Sentiment drift -> investigate content or flow
    drift_count = len(report.sentiment_drift_conversations)
    if drift_count > 0:
        recs.append(
            f"Investigate {drift_count} conversation(s) with significant sentiment "
            "degradation. Review agent responses at the point where sentiment drops."
        )

    # Escalation paths -> automate top paths
    if report.escalation_paths:
        top_path = report.escalation_paths[0]
        recs.append(
            f"Automate or improve the path '{top_path.path_signature}' "
            f"leading to escalation ({top_path.count} occurrences)."
        )

    # Quality samples -> address low-scoring conversations
    low_quality = [s for s in report.quality_samples if s.quality_score < 0.5]
    if low_quality:
        unique_notes = sorted({
            s.quality_notes for s in low_quality
            if s.quality_notes and s.quality_notes != "no issues detected"
        })
        issues_summary = "; ".join(unique_notes)[:200]
        recs.append(
            f"Review {len(low_quality)} sampled conversation(s) with quality score < 0.5. "
            + (f"Common issues: {issues_summary}." if issues_summary else "")
        )

    if not recs:
        recs.append(
            "No significant improvement opportunities detected in this analysis window."
        )

    return recs


# ---------------------------------------------------------------------------
# Report rendering
# ---------------------------------------------------------------------------

def _fmt_dt(dt_str: str) -> str:
    return dt_str[:10] if len(dt_str) >= 10 else dt_str


def render_markdown(report: AnalysisReport) -> str:
    lines = []
    lines.append("# Conversation Transcript Analysis Report")
    lines.append("")
    lines.append(f"Generated: {report.generated_at}")
    lines.append(f"Period: {_fmt_dt(report.period_start)} to {_fmt_dt(report.period_end)}")
    lines.append(f"Retention window: {report.retention_days} days")
    lines.append(f"Total conversations: {report.total_conversations}")
    lines.append(f"Total turns: {report.total_turns}")
    lines.append("")

    # Recommendations
    lines.append("## Recommendations")
    lines.append("")
    for rec in report.recommendations:
        lines.append(f"- {rec}")
    lines.append("")

    # 1. Intent clusters
    lines.append("## 1. Unrecognized Intent Clusters")
    lines.append("")
    if report.intent_clusters:
        lines.append("| Cluster | Size | Common Terms | Example Conversations |")
        lines.append("|---------|------|--------------|----------------------|")
        for c in report.intent_clusters:
            terms = ", ".join(c.common_terms)
            conv_ids = ", ".join(c.conversation_ids[:3])
            lines.append(f"| {c.cluster_id} | {c.size} | {terms} | {conv_ids} |")
    else:
        lines.append("No unrecognized intent clusters detected.")
    lines.append("")

    # 2. Topic confusion matrix
    lines.append("## 2. Topic Confusion Matrix")
    lines.append("")
    if report.confusion_pairs:
        lines.append("| Intended Topic | Actual Topic | Count | Example Conversations |")
        lines.append("|---------------|--------------|-------|-----------------------|")
        for p in report.confusion_pairs:
            conv_ids = ", ".join(p.example_conversation_ids[:3])
            lines.append(f"| {p.intended_topic} | {p.actual_topic} | {p.count} | {conv_ids} |")
    else:
        lines.append("No topic confusion patterns detected.")
    lines.append("")

    # 3. Knowledge gaps
    lines.append("## 3. Knowledge Gap Detection")
    lines.append("")
    if report.knowledge_gaps:
        lines.append("| Query Hash | Common Terms | Occurrences | Example Conversations |")
        lines.append("|------------|--------------|-------------|----------------------|")
        for g in report.knowledge_gaps:
            terms = ", ".join(g.common_terms)
            conv_ids = ", ".join(g.conversation_ids[:3])
            lines.append(f"| {g.query_hash} | {terms} | {g.occurrence_count} | {conv_ids} |")
    else:
        lines.append("No knowledge gaps detected.")
    lines.append("")

    # 4. Sentiment drift
    lines.append("## 4. Sentiment Drift")
    lines.append("")
    if report.sentiment_drift_conversations:
        lines.append("| Conversation ID | Opening | Closing | Drift Delta | Turns |")
        lines.append("|----------------|---------|---------|-------------|-------|")
        for s in report.sentiment_drift_conversations[:20]:
            lines.append(
                f"| {s.conversation_id} | {s.opening_sentiment:.3f} | "
                f"{s.closing_sentiment:.3f} | {s.drift_delta:.3f} | {s.turn_count} |"
            )
    else:
        lines.append("No significant sentiment drift detected.")
    lines.append("")

    # 5. Escalation paths
    lines.append("## 5. Escalation Pattern Analysis")
    lines.append("")
    if report.escalation_paths:
        lines.append("| Path | Count | Example Conversations |")
        lines.append("|------|-------|-----------------------|")
        for p in report.escalation_paths:
            conv_ids = ", ".join(p.example_conversation_ids[:3])
            lines.append(f"| {p.path_signature} | {p.count} | {conv_ids} |")
    else:
        lines.append("No escalation patterns detected.")
    lines.append("")

    # 6. Quality samples
    lines.append("## 6. Response Quality Sampling")
    lines.append("")
    if report.quality_samples:
        lines.append("| Conversation ID | Turns | Fallback Rate | KB Hit Rate | Escalated | Quality Score | Notes |")
        lines.append("|----------------|-------|---------------|-------------|-----------|--------------|-------|")
        for s in report.quality_samples:
            esc = "Yes" if s.escalated else "No"
            lines.append(
                f"| {s.conversation_id} | {s.turn_count} | "
                f"{s.fallback_rate:.0%} | {s.knowledge_hit_rate:.0%} | "
                f"{esc} | {s.quality_score:.3f} | {s.quality_notes} |"
            )
    else:
        lines.append("No quality samples generated.")
    lines.append("")

    lines.append("---")
    lines.append("")
    lines.append(
        "Privacy notice: This report contains conversation IDs only. "
        "No user identifiers or message text are included in the output."
    )
    return "\n".join(lines)


def render_json(report: AnalysisReport) -> str:
    def _serialize(obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        raise TypeError(f"Not serializable: {type(obj)}")
    return json.dumps(asdict(report), indent=2, default=_serialize)


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def run_pipeline(
    input_path: str,
    input_format: str,
    retention_days: int,
    sample_size: int,
    similarity_threshold: float,
    drift_threshold: float,
    report_format: str,
    output_path: Optional[str],
    random_seed: Optional[int],
) -> int:
    # Load turns
    if not os.path.isfile(input_path):
        print(f"Error: input file not found: {input_path}", file=sys.stderr)
        return 1

    if input_format == "json":
        turns = load_json(input_path)
    else:
        turns = load_csv(input_path)

    if not turns:
        print("Error: no conversation turns loaded from input.", file=sys.stderr)
        return 1

    # Apply retention cutoff
    now = datetime.now(tz=timezone.utc)
    cutoff = now - timedelta(days=retention_days)
    conversations = group_conversations(turns, cutoff)

    if not conversations:
        print(
            f"Warning: no conversations within the last {retention_days} days.",
            file=sys.stderr,
        )
        return 1

    # Determine period bounds
    all_times = [
        c.started_at for c in conversations.values() if c.started_at is not None
    ]
    if all_times:
        period_start = min(all_times).isoformat()
        period_end = max(all_times).isoformat()
    else:
        period_start = cutoff.isoformat()
        period_end = now.isoformat()

    total_turns = sum(len(c.turns) for c in conversations.values())

    # Run analyses
    intent_clusters = analyze_intent_clusters(conversations, similarity_threshold)
    confusion_pairs = analyze_topic_confusion(conversations)
    knowledge_gaps = analyze_knowledge_gaps(conversations, similarity_threshold)
    sentiment_drifts = analyze_sentiment_drift(conversations, drift_threshold)
    escalation_paths = analyze_escalation_paths(conversations)
    quality_samples = analyze_quality_samples(conversations, sample_size, random_seed)

    report = AnalysisReport(
        generated_at=now.isoformat(),
        period_start=period_start,
        period_end=period_end,
        total_conversations=len(conversations),
        total_turns=total_turns,
        retention_days=retention_days,
        intent_clusters=intent_clusters,
        confusion_pairs=confusion_pairs,
        knowledge_gaps=knowledge_gaps,
        sentiment_drift_conversations=sentiment_drifts,
        escalation_paths=escalation_paths,
        quality_samples=quality_samples,
        recommendations=[],
    )

    report.recommendations = generate_recommendations(report)

    # Render
    if report_format == "json":
        output = render_json(report)
    else:
        output = render_markdown(report)

    if output_path:
        with open(output_path, "w", encoding="utf-8") as fh:
            fh.write(output)
        print(f"Report written to {output_path}", file=sys.stderr)
    else:
        print(output)

    return 0


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Analyse Copilot Studio conversation transcripts for improvement opportunities.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--input",
        metavar="FILE",
        required=True,
        help="Path to the transcript export file (CSV or JSON).",
    )
    parser.add_argument(
        "--format",
        choices=["csv", "json"],
        default="csv",
        dest="input_format",
        help="Input file format: csv (default) or json.",
    )
    parser.add_argument(
        "--output",
        metavar="FILE",
        default=None,
        help="Path to write the report (default: stdout).",
    )
    parser.add_argument(
        "--report-format",
        choices=["markdown", "json"],
        default="markdown",
        help="Report output format: markdown (default) or json.",
    )
    parser.add_argument(
        "--retention-days",
        metavar="DAYS",
        type=int,
        default=DEFAULT_RETENTION_DAYS,
        help=f"Exclude conversations older than DAYS days (default: {DEFAULT_RETENTION_DAYS}).",
    )
    parser.add_argument(
        "--sample-size",
        metavar="N",
        type=int,
        default=DEFAULT_SAMPLE_SIZE,
        help=f"Number of conversations to include in quality sample (default: {DEFAULT_SAMPLE_SIZE}).",
    )
    parser.add_argument(
        "--similarity-threshold",
        metavar="FLOAT",
        type=float,
        default=DEFAULT_CLUSTER_SIMILARITY_THRESHOLD,
        help=f"Cosine similarity threshold for clustering (default: {DEFAULT_CLUSTER_SIMILARITY_THRESHOLD}).",
    )
    parser.add_argument(
        "--drift-threshold",
        metavar="FLOAT",
        type=float,
        default=DEFAULT_SENTIMENT_DRIFT_THRESHOLD,
        help=f"Sentiment drift delta threshold (default: {DEFAULT_SENTIMENT_DRIFT_THRESHOLD}).",
    )
    parser.add_argument(
        "--seed",
        metavar="INT",
        type=int,
        default=None,
        help="Random seed for reproducible quality sampling.",
    )
    return parser


def main(argv=None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.retention_days < 1:
        print("Error: --retention-days must be at least 1.", file=sys.stderr)
        return 2
    if args.sample_size < 1:
        print("Error: --sample-size must be at least 1.", file=sys.stderr)
        return 2
    if not 0.0 < args.similarity_threshold < 1.0:
        print("Error: --similarity-threshold must be between 0 and 1 (exclusive).", file=sys.stderr)
        return 2

    return run_pipeline(
        input_path=args.input,
        input_format=args.input_format,
        retention_days=args.retention_days,
        sample_size=args.sample_size,
        similarity_threshold=args.similarity_threshold,
        drift_threshold=args.drift_threshold,
        report_format=args.report_format,
        output_path=args.output,
        random_seed=args.seed,
    )


if __name__ == "__main__":
    sys.exit(main())
