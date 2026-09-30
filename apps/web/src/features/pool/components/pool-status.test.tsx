import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PoolStatus } from "./pool-status";

describe("PoolStatus", () => {
  it("renders status badges for all lifecycle states", () => {
    const { rerender } = render(<PoolStatus status="MATCHING" />);
    expect(screen.getByText("MATCHING")).toBeInTheDocument();

    rerender(<PoolStatus status="ACTIVE" />);
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();

    rerender(<PoolStatus status="COMPLETED" />);
    expect(screen.getByText("COMPLETED")).toBeInTheDocument();

    rerender(<PoolStatus status="CANCELLED" />);
    expect(screen.getByText("CANCELLED")).toBeInTheDocument();
  });

  it("renders lifecycle progression when showLifecycle is true", () => {
    render(<PoolStatus status="ACTIVE" showLifecycle />);

    const lifecycleContainer = screen.getByTestId("pool-lifecycle");
    expect(lifecycleContainer).toBeInTheDocument();
    expect(lifecycleContainer).toHaveTextContent("Matching");
    expect(lifecycleContainer).toHaveTextContent("Active");
    expect(lifecycleContainer).toHaveTextContent("Completed");
  });

  it("handles loading state", () => {
    render(<PoolStatus isLoading />);

    expect(screen.getByTestId("pool-status-loading")).toBeInTheDocument();
    expect(screen.getByText("Loading status...")).toBeInTheDocument();
  });

  it("handles error state", () => {
    render(<PoolStatus errorMessage="Failed to determine pool status" />);

    expect(screen.getByTestId("pool-status-error")).toBeInTheDocument();
    expect(screen.getByText("Failed to determine pool status")).toBeInTheDocument();
  });

  it("handles empty state", () => {
    render(<PoolStatus status={null} />);

    expect(screen.getByTestId("pool-status-empty")).toBeInTheDocument();
    expect(screen.getByText("No status")).toBeInTheDocument();
  });
});
