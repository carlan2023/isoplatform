import { localMemoryCertificateStore } from "@/lib/certificate-runtime";
import CertificateEditor from "./editor";

export const dynamic = "force-dynamic";

export default function AdminCertificatesPage() {
  return <CertificateEditor demoUnlocked={localMemoryCertificateStore()} />;
}
