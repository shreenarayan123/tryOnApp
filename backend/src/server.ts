import {config} from './config';
import {createApp} from './app';

const app = createApp();

app.listen(config.port, () => {
  console.log(`TrySnap backend listening on http://localhost:${config.port}`);
});
