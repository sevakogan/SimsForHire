import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase-server before importing the module under test
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockLimit = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
}));

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createSupabaseServer: vi.fn(() =>
    Promise.resolve({
      from: mockFrom,
      auth: { getUser: mockGetUser },
    })
  ),
}));

// Import after mocks are set up
import {
  getItems,
  getItemsForClient,
  getNextItemNumber,
  createItem,
  deleteItem,
} from "./items";

describe("items actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default chain: from -> select -> eq -> order -> resolves
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ order: mockOrder, single: mockSingle });
    mockOrder.mockReturnValue({
      data: [],
      error: null,
      limit: mockLimit,
    });
    mockLimit.mockReturnValue({ data: [], error: null });
    mockSingle.mockReturnValue({ data: null, error: null });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });
  });

  describe("getItems (admin view)", () => {
    it("selects all columns including my_cost and my_shipping", async () => {
      mockOrder.mockReturnValue({ data: [], error: null });

      await getItems("project-1");

      expect(mockFrom).toHaveBeenCalledWith("items");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockEq).toHaveBeenCalledWith("project_id", "project-1");
    });
  });

  describe("getItemsForClient (client view)", () => {
    it("selects only safe columns, excluding my_cost and my_shipping", async () => {
      mockOrder.mockReturnValue({ data: [], error: null });

      await getItemsForClient("project-1");

      expect(mockFrom).toHaveBeenCalledWith("items");

      const selectArg = mockSelect.mock.calls[0][0] as string;

      // Must NOT contain my_cost or my_shipping
      expect(selectArg).not.toContain("my_cost");
      expect(selectArg).not.toContain("my_shipping");

      // Must contain all the safe columns
      expect(selectArg).toContain("id");
      expect(selectArg).toContain("project_id");
      expect(selectArg).toContain("item_number");
      expect(selectArg).toContain("item_type");
      expect(selectArg).toContain("description");
      expect(selectArg).toContain("retail_price");
      expect(selectArg).toContain("retail_shipping");
      expect(selectArg).toContain("discount_percent");
      expect(selectArg).toContain("price_sold_for");
      expect(selectArg).toContain("image_url");
      expect(selectArg).toContain("notes");
    });
  });

  describe("getNextItemNumber", () => {
    it("returns 1 when no items exist", async () => {
      mockOrder.mockReturnValue({ limit: mockLimit });
      mockLimit.mockReturnValue({ data: [] });

      const num = await getNextItemNumber("project-1");
      expect(num).toBe(1);
    });

    it("returns max + 1 when items exist", async () => {
      mockOrder.mockReturnValue({ limit: mockLimit });
      mockLimit.mockReturnValue({ data: [{ item_number: 5 }] });

      const num = await getNextItemNumber("project-1");
      expect(num).toBe(6);
    });
  });

  describe("createItem", () => {
    it("inserts item and returns id on success", async () => {
      // Chain: from -> insert -> select -> single
      const mockInsertSelect = vi.fn().mockReturnValue({ single: mockSingle });
      mockInsert.mockReturnValue({ select: mockInsertSelect });
      mockSingle.mockReturnValue({ data: { id: "item-abc" }, error: null });

      const result = await createItem({
        project_id: "project-1",
        item_number: 1,
        item_type: "Furniture",
        description: "A table",
        retail_price: 100,
        retail_shipping: 10,
        discount_percent: 5,
        my_cost: 50,
        my_shipping: 5,
      });

      expect(result).toEqual({ id: "item-abc", error: null });
    });
  });

  describe("deleteItem", () => {
    it("deletes item by id", async () => {
      mockEq.mockReturnValue({ error: null });

      const result = await deleteItem("item-abc");
      expect(result).toEqual({ error: null });
      expect(mockFrom).toHaveBeenCalledWith("items");
    });
  });
});
