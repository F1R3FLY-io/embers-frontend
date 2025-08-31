import { Text } from "@/lib/components/Text";

interface AgentsTitleProps {
  getTitle: () => string;
}

export function AgentsTitle({ getTitle }: AgentsTitleProps) {
  return (
    <Text fontSize={32} color="primary" bold>
      {getTitle()}
    </Text>
  );
}
