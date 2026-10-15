import UgandaIsoLanding, {
  ugandaIsoMetadata,
} from "@/app/components/UgandaIsoLanding";
import { getUgandaIsoPage } from "@/lib/uganda-iso";

const page = getUgandaIsoPage("/iso-certification-uganda");

export const dynamic = "force-static";
export const metadata = ugandaIsoMetadata(page);

export default function IsoCertificationUgandaPage() {
  return <UgandaIsoLanding page={page} />;
}
