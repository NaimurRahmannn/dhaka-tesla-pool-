import { DriverRideDetailsPage } from "@/features/driver";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DriverRideRoute({ params }: PageProps) {
  const { id } = await params;

  return <DriverRideDetailsPage rideId={id} />;
}
