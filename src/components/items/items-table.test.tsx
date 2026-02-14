import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ItemsTable } from "./items-table";
import type { Item } from "@/types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { src, alt, ...rest } = props;
    return <img src={src as string} alt={alt as string} {...rest} />;
  },
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Mock delete action
vi.mock("@/lib/actions/items", () => ({
  deleteItem: vi.fn(),
}));

const sampleItem: Item = {
  id: "item-1",
  project_id: "proj-1",
  item_number: 1,
  item_type: "Furniture",
  description: "A nice table",
  item_link: null,
  retail_price: 100,
  retail_shipping: 10,
  discount_percent: 5,
  my_cost: 50,
  my_shipping: 5,
  price_sold_for: null,
  image_url: null,
  notes: "",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

describe("ItemsTable", () => {
  it("shows my_cost and my_shipping columns for admin", () => {
    render(
      <ItemsTable items={[sampleItem]} projectId="proj-1" isAdmin={true} />
    );

    expect(screen.getByText("My Cost")).toBeInTheDocument();
    expect(screen.getByText("My Ship")).toBeInTheDocument();
    expect(screen.getByText("$50.00")).toBeInTheDocument();
    expect(screen.getByText("$5.00")).toBeInTheDocument();
  });

  it("hides my_cost and my_shipping columns for client", () => {
    const { my_cost, my_shipping, ...clientItem } = sampleItem;
    void my_cost;
    void my_shipping;

    render(
      <ItemsTable items={[clientItem]} projectId="proj-1" isAdmin={false} />
    );

    expect(screen.queryByText("My Cost")).not.toBeInTheDocument();
    expect(screen.queryByText("My Ship")).not.toBeInTheDocument();
  });

  it("shows edit/delete actions for admin", () => {
    render(
      <ItemsTable items={[sampleItem]} projectId="proj-1" isAdmin={true} />
    );

    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("hides edit/delete actions for client", () => {
    render(
      <ItemsTable items={[sampleItem]} projectId="proj-1" isAdmin={false} />
    );

    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("shows empty state when no items", () => {
    render(
      <ItemsTable items={[]} projectId="proj-1" isAdmin={false} />
    );

    expect(screen.getByText("No items yet.")).toBeInTheDocument();
  });
});
