import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PoolMembers } from "./pool-members";

describe("PoolMembers", () => {
  it("renders member count only without capacity", () => {
    render(<PoolMembers count={2} />);

    expect(screen.getByText("Members:")).toBeInTheDocument();
    expect(screen.getByTestId("pool-members-count")).toHaveTextContent("2");
  });

  it("renders member count with vehicle capacity", () => {
    render(<PoolMembers count={2} capacity={3} />);

    expect(screen.getByText("Members:")).toBeInTheDocument();
    expect(screen.getByTestId("pool-members-count")).toHaveTextContent("2/3");
  });

  it("renders without label when showLabel is false", () => {
    render(<PoolMembers count={4} showLabel={false} />);

    expect(screen.queryByText("Members:")).not.toBeInTheDocument();
    expect(screen.getByTestId("pool-members-count")).toHaveTextContent("4");
  });
});
