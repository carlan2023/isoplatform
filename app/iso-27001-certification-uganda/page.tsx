import UgandaIsoLanding, {
  ugandaIsoMetadata,
} from "@/app/components/UgandaIsoLanding";
import { getUgandaIsoPage } from "@/lib/uganda-iso";

const page = getUgandaIsoPage("/iso-27001-certification-uganda");

export const dynamic = "force-static";
export const metadata = ugandaIsoMetadata(page);

export default function Iso27001CertificationUgandaPage() {
  return <UgandaIsoLanding page={page} />;
}
