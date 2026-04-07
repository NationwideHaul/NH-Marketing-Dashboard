"use client";

interface SocialPreviewProps {
  platform: "facebook" | "instagram" | "youtube" | "linkedin" | "gmb";
}

const profiles = {
  facebook: {
    name: "Nationwide Haul",
    handle: "nationwidehaul",
    avatar: "/nh-logo-black.png",
    followers: "1,595",
    following: "48",
    posts: "42",
    bio: "Commercial Truck Dealership\nNew & Used Trucks & Trailers\nSales · Leasing · Financing · Service",
    locations: "Pompano & Lakeland, FL | Macon, GA",
    url: "facebook.com/nationwidehaul",
  },
  instagram: {
    name: "Nationwide Haul",
    handle: "@nationwidehaul",
    avatar: "/nh-logo-black.png",
    followers: "1,035",
    following: "401",
    posts: "93",
    bio: "Commercial Truck Dealership 🚛\nAll in one trucking solutions\nNew & Used Trucks & Trailers\nSales · Leasing · Financing · Service",
    locations: "Pompano & Lakeland, FL | Macon, GA",
    url: "linktr.ee/nationwidehaul",
  },
  youtube: {
    name: "Nationwide Haul",
    handle: "@NationwideHaul",
    avatar: "/nh-logo-black.png",
    subscribers: "92",
    videos: "40",
    description: "Welcome to Nationwide Haul's official YouTube channel—your trusted source for semi-truck and trailers.",
    url: "nationwidehaul.com",
  },
  linkedin: {
    name: "Nationwide Haul",
    handle: "nationwide-haul",
    avatar: "/nh-logo-black.png",
    followers: "245",
    employees: "50-200",
    industry: "Truck Transportation",
    description: "Your one-stop trucking partner for new and used commercial vehicles.",
    url: "linkedin.com/company/nationwide-haul",
  },
  gmb: {
    name: "Nationwide Haul",
    avatar: "/nh-logo-black.png",
    rating: "4.8",
    reviews: "127",
    category: "Commercial Truck Dealer",
    address: "1400 SW 1st Ct, Pompano Beach, FL 33069",
    phone: "(954) 440-1124",
    hours: "Mon-Fri 8:00 AM - 6:00 PM",
    url: "nationwidehaul.com",
  },
};

export function SocialPreview({ platform }: SocialPreviewProps) {
  if (platform === "facebook" || platform === "instagram") {
    const p = profiles[platform];
    return (
      <div className="rounded-lg border border-border bg-card p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <img src={p.avatar} alt={p.name} className="h-16 w-16 rounded-full border border-border" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-card-foreground">{p.name}</h3>
            <p className="text-xs text-muted-foreground">{p.handle}</p>
            <div className="flex gap-4 mt-2 text-xs">
              <span><strong>{p.posts}</strong> posts</span>
              <span><strong>{p.followers}</strong> followers</span>
              <span><strong>{p.following}</strong> following</span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-card-foreground whitespace-pre-line">{p.bio}</p>
        <p className="mt-1 text-xs text-muted-foreground">📍 {p.locations}</p>
        <p className="mt-1 text-xs text-primary">🔗 {p.url}</p>
      </div>
    );
  }

  if (platform === "youtube") {
    const p = profiles.youtube;
    return (
      <div className="rounded-lg border border-border bg-card p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <img src={p.avatar} alt={p.name} className="h-14 w-14 rounded-full border border-border" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-card-foreground">{p.name}</h3>
            <p className="text-xs text-muted-foreground">{p.handle}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {p.subscribers} subscribers · {p.videos} videos
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-card-foreground">{p.description}</p>
        <p className="mt-1 text-xs text-primary">🔗 {p.url}</p>
      </div>
    );
  }

  if (platform === "linkedin") {
    const p = profiles.linkedin;
    return (
      <div className="rounded-lg border border-border bg-card p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <img src={p.avatar} alt={p.name} className="h-14 w-14 rounded-lg border border-border" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-card-foreground">{p.name}</h3>
            <p className="text-xs text-muted-foreground">{p.industry} · {p.employees} employees</p>
            <p className="text-xs text-muted-foreground mt-1">{p.followers} followers</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-card-foreground">{p.description}</p>
      </div>
    );
  }

  if (platform === "gmb") {
    const p = profiles.gmb;
    return (
      <div className="rounded-lg border border-border bg-card p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <img src={p.avatar} alt={p.name} className="h-14 w-14 rounded-lg border border-border" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-card-foreground">{p.name}</h3>
            <p className="text-xs text-muted-foreground">{p.category}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs font-medium text-yellow-600">★ {p.rating}</span>
              <span className="text-xs text-muted-foreground">({p.reviews} reviews)</span>
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-1 text-xs text-card-foreground">
          <p>📍 {p.address}</p>
          <p>📞 {p.phone}</p>
          <p>🕐 {p.hours}</p>
        </div>
      </div>
    );
  }

  return null;
}
