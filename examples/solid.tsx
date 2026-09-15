import { render } from "@opentui/solid";

import { Content } from "./solid/content.tsx";
import { Layout } from "./solid/layout.tsx";

function App() {
  return (
    <Layout>
      <Content />
    </Layout>
  );
}

await render(() => <App />, { exitOnCtrlC: true });
