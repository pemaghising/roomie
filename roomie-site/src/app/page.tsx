import { Phone } from "@/ui/Phone";
import { StoreButtons } from "@/ui/StoreButtons";

export default function Home() {
  return (
    <main>
      <StoreButtons />
      <Phone src="/screens/h1-home.png" alt="Roomie home screen" />
    </main>
  );
}
