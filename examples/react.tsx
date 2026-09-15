/** @jsxImportSource @opentui/react */

import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";

import { Content } from "./react/content.tsx";
import { Layout } from "./react/layout.tsx";

function App() {
  return (
    <Layout>
      <Content />
    </Layout>
  );
}

const renderer = await createCliRenderer({ exitOnCtrlC: true });
createRoot(renderer).render(<App />);
