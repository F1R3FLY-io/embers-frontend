import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useMutationResultWithLoader } from "@/lib/providers/loader/useMutationResultWithLoader";
import { useConfirm } from "@/lib/providers/modal/useConfirm";
import { useDeleteOslfMutation, useOslfs } from "@/lib/queries";
import GraphicalQueries from "@/public/icons/graphical-query.svg?react";

import { Grid } from "../Grid";

interface AgentTeamsTabProps {
  searchQuery: string;
  sortBy: "date" | "name";
}

export default function GraphicalQueryTab({
  searchQuery,
  sortBy,
}: AgentTeamsTabProps) {
  const { data } = useOslfs();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const onCreate = useCallback(() => {
    void navigate("/oslf/create");
  }, [navigate]);
  const onNavigate = useCallback(
    (id: string) => {
      void navigate("/oslf", {
        state: data?.oslfs.find((oslf) => oslf.id === id),
      });
    },
    [data, navigate],
  );

  const deleteOSLF = useMutationResultWithLoader(useDeleteOslfMutation());
  const confirm = useConfirm();
  const onDelete = (id: string, name: string) =>
    void confirm({ message: `Are you sure you want to delete ${name}?` })
      .then((ok) => ok && deleteOSLF.mutate(id))
      .catch(() => {});

  const filteredOSLF = useMemo(() => {
    const agents = data?.oslfs ?? [];
    const q = searchQuery.trim().toLowerCase();

    const filtered = q
      ? agents.filter((a) => {
          const fields = [a.name, a.id, a.version]
            .filter(Boolean)
            .map((v) => v.toLowerCase());
          return fields.some((f) => f.includes(q));
        })
      : agents;

    return [...filtered]
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name, undefined, {
            sensitivity: "base",
          });
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .map((query) => ({
        createdAt: query.createdAt,
        id: query.id,
        name: query.name,
        type: "normal" as const,
      }));
  }, [data?.oslfs, searchQuery, sortBy]);

  return (
    <Grid
      data={filteredOSLF}
      icon={GraphicalQueries}
      title={t("oslf.createNew")}
      onCreate={onCreate}
      onDelete={onDelete}
      onNavigate={onNavigate}
    />
  );
}
