import { redirect } from "next/navigation";

// Redirect old /ringcentral to /call-logs
export default function RingCentralRedirect() {
  redirect("/call-logs");
}
