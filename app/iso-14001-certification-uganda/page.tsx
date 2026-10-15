import UgandaIsoLanding, {
  ugandaIsoMetadata,
} from "@/app/components/UgandaIsoLanding";
import { getUgandaIsoPage } from "@/lib/uganda-iso";

const page = getUgandaIsoPage("/iso-14001-certification-uganda");

export const dynamic = "force-static";
export const metadata = ugandaIsoMetadata(page);

export default function Iso14001CertificationUgandaPage() {
  return <UgandaIsoLanding page={page} />;
}
