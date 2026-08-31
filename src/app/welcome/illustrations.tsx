function ThemedIllustration({ light, dark, alt }: { light: string; dark: string; alt: string }) {
  return (
    <div className="relative mx-auto h-[min(28vh,208px)] w-full max-w-[280px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={light}
        alt={alt}
        className="absolute inset-0 h-full w-full object-contain dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dark}
        alt={alt}
        className="absolute inset-0 hidden h-full w-full object-contain dark:block"
      />
    </div>
  );
}

export function DiscoverIllustration() {
  return (
    <ThemedIllustration
      light="/welcome/light_discover.png"
      dark="/welcome/dark_discover.png"
      alt="Scholarships, jobs, internships, hackathons and grants icons"
    />
  );
}

export function FitYouIllustration() {
  return (
    <ThemedIllustration
      light="/welcome/light_fit.png"
      dark="/welcome/dark_fit.png"
      alt="Recommended opportunities matched to your interests"
    />
  );
}

export function BuildFutureIllustration() {
  return (
    <ThemedIllustration
      light="/welcome/light_future.png"
      dark="/welcome/dark_future.png"
      alt="Learn, build, connect, fund, tools and grow features"
    />
  );
}

export function StartHereIllustration() {
  return (
    <ThemedIllustration
      light="/welcome/light_start.png"
      dark="/welcome/dark_start.png"
      alt="Join thousands of people on Aza"
    />
  );
}
