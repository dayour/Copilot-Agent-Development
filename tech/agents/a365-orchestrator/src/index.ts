import { App } from '@microsoft/teams.apps';
import { DevtoolsPlugin } from '@microsoft/teams.dev';
import { router } from './router';

const app = new App({
  plugins: [new DevtoolsPlugin()],
});

app.on('message', async ({ send, activity }) => {
  await send({ type: 'typing' });

  const response = await router.dispatch(activity.text ?? '', activity);
  await send(response);
});

(async () => {
  await router.initialize();
  await app.start(+(process.env.PORT ?? 3978));
  console.log('A365 Orchestrator is running on port', process.env.PORT ?? 3978);
  console.log('DevTools available at: http://localhost:3979/devtools');
})();
