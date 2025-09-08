import { Text } from "@/lib/components/Text";

interface AgentsTitleProps {
  getTitle: () => string;
}

export function AgentsTitle({ getTitle }: AgentsTitleProps) {
  return (
    <Text bold color="primary" fontSize={32}>
      {getTitle()}
    </Text>
  );
}
