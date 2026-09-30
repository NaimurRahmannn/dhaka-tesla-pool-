import { RideDetailsPage } from "@/features/passenger";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PassengerRideDetailsRoute({
  params,
}: PageProps) {
  const { id } = await params;

  return <RideDetailsPage rideId={id} />;
}
