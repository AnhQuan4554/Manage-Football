"use client";

import { Button, Input, List, Tag } from "antd";
import type { Opponent } from "@/features/opponents/types";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type OpponentsListSectionProps = {
  opponents: Opponent[];
  query: string;
  errorMessage?: string;
};

export function OpponentsListSection({ opponents, query, errorMessage }: OpponentsListSectionProps) {
  return (
    <>
      <section className="surface-card">
        <form action="/opponents" method="get">
          <div style={{ display: "flex", width: "100%" }}>
            <Input name="q" placeholder="Tìm theo tên đối thủ..." defaultValue={query} allowClear />
            <Button type="primary" htmlType="submit">
              Tìm
            </Button>
          </div>
        </form>
      </section>

      <section className="surface-card">
        {errorMessage ? (
          <p className="muted" style={{ margin: 0 }}>
            {errorMessage}
          </p>
        ) : (
          <List
            dataSource={opponents}
            locale={{ emptyText: "Chưa có đối thủ nào được lưu." }}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <strong>{item.name}</strong>
                      <Tag color="magenta">{item.matchCount} trận</Tag>
                    </div>
                  }
                  description={
                    <div className="muted" style={{ display: "grid", gap: 4 }}>
                      <span>{item.phone ? `Số đối: ${item.phone}` : "Chưa có số điện thoại"}</span>
                      {item.lastPlayedAt ? <span>Gặp gần nhất: {formatDateTime(item.lastPlayedAt)}</span> : null}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </section>
    </>
  );
}
