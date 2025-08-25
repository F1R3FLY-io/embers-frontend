import { useEffect } from "react";

import { GraphEditor } from "@/lib/components/GraphEditor";
import { Spinner } from "@/lib/components/Spinner";
import { GraphLayout } from "@/lib/layouts/Graph";
import { useLayout } from "@/lib/providers/layout/useLayout";
import { useDeployDemo, useRunDemo } from "@/lib/queries";

// Half-baked. Demo only
export default function CreateAiTeamFlow() {
  const { setHeaderTitle } = useLayout();
  useEffect(() => setHeaderTitle("New AI team"), [setHeaderTitle]);

  const deployDemo = useDeployDemo();
  const runDemo = useRunDemo();
  // eslint-disable-next-line no-console
  console.log(runDemo.data);

  return (
    <GraphLayout
      onDeploy={() => deployDemo.mutate("demoName")}
      onRun={() =>
        runDemo.mutate({
          name: "demoName",
          prompt: "Describe an appearance of human-like robot",
        })
      }
    >
      <GraphEditor />
      <Spinner isOpen={deployDemo.isPending || runDemo.isPending} />
    </GraphLayout>
  );
}
