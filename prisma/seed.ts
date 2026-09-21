import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Deterministic RNG (mulberry32) - same output on every run, so reseeding is
// reproducible and idempotent.
function makeRng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = makeRng(42);
const pick = <T>(arr: T[]) => arr[Math.floor(rng() * arr.length)];
const int = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));

const slugify = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const CATALOG: Record<string, string[]> = {
  Electronics: [
    "Aurora X5 Wireless Noise-Cancelling Headphones",
    "VoltEdge 65W GaN USB-C Fast Charger",
    "Nimbus 4K Ultra HD Streaming Stick",
    "Tactile Pro Mechanical Keyboard - Hot-Swappable",
    "OrbitCam 1080p Wide-Angle Webcam",
    "PulseFit S2 Smartwatch with Heart Rate",
    "SoundCore Mini Portable Bluetooth Speaker",
    "LumaDesk LED Monitor Light Bar",
    "HyperDrive 7-in-1 USB-C Hub",
    "EchoWave True Wireless Earbuds",
    "TerraByte 1TB Portable SSD",
    "Glide Precision Wireless Mouse",
    "ClearView 27-inch QHD IPS Monitor",
    "PowerNest 20000mAh Laptop Power Bank",
    "StreamLine Condenser USB Microphone",
    "AeroCool Laptop Cooling Pad",
  ],
  Home: [
    "HearthGlow Ceramic Pour-Over Coffee Set",
    "NordicWeave Throw Blanket - Chunky Knit",
    "PureMist Ultrasonic Essential Oil Diffuser",
    "EverSharp 8-inch Chef's Knife - German Steel",
    "CloudRest Memory Foam Pillow - Set of 2",
    "TerraPlanter Self-Watering Indoor Pot Trio",
    "AmberGlow Himalayan Salt Lamp",
    "FreshSeal Glass Food Storage Set - 18 Pieces",
    "SilentBreeze Tower Fan with Remote",
    "Heritage Oak Floating Wall Shelves - Set of 3",
    "SteamEase 1500W Garment Steamer",
    "ZenGarden Indoor Herb Starter Kit",
    "DuskShade Blackout Curtains - Pair",
    "CopperLine Moscow Mule Mugs - Set of 4",
    "CozyNest Weighted Blanket 15 lbs",
    "BrightPath Motion-Sensor Night Lights - 6 Pack",
  ],
  Books: [
    "The Silent Meridian - A Novel by Elena Vasquez",
    "Atomic Routines: Small Habits, Remarkable Days",
    "Deep Code: A Developer's Guide to Focus",
    "The Cartographer's Daughter - Historical Fiction",
    "Salt & Stone: Recipes from the Coast",
    "Thinking in Systems - Revised Edition",
    "The Last Lighthouse Keeper - A Memoir",
    "Practical TypeScript: From Novice to Craftsman",
    "Where Rivers Meet - Poetry Collection",
    "The Founder's Dilemma - Startup Case Studies",
    "Mythos Reborn: Legends for a New Age",
    "The Quiet Art of Japanese Joinery",
    "Stellar Drift - Space Opera Omnibus",
    "The Mindful Kitchen: Cooking as Practice",
    "Empires of Sand - A History of Trade Routes",
    "Letters from the Field: A Naturalist's Year",
  ],
  Fashion: [
    "Atlas Classic Crewneck Tee - Organic Cotton",
    "Meridian Slim-Fit Stretch Chinos",
    "CloudStep Knit Running Sneakers",
    "Heritage Denim Trucker Jacket",
    "Solstice Polarized Aviator Sunglasses",
    "Trekker Water-Resistant Canvas Backpack",
    "Everyday Merino Wool Crew Socks - 5 Pack",
    "Ember Fleece Quarter-Zip Pullover",
    "Halcyon Leather Weekender Duffel",
    "Current Linen-Blend Camp Shirt",
    "Summit Insulated Puffer Vest",
    "Tideline Quick-Dry Swim Trunks",
    "Forge Minimalist Leather Belt",
    "Willow Ribbed Knit Beanie",
    "Cirrus Packable Rain Jacket",
    "Haven Slip-On Canvas Loafers",
  ],
  Toys: [
    "BuildMaster 500-Piece Creative Brick Set",
    "RoboPup Interactive Robot Dog",
    "SkyRider RC Stunt Drone with Camera",
    "WonderLab Junior Science Experiment Kit",
    "CastleQuest Magnetic Tile Set - 100 Pieces",
    "PaintBox Deluxe Art Supply Case",
    "TurboTrack Loop-the-Loop Race Set",
    "StoryTime Plush Dragon - 16 inch",
    "PuzzlePeak 1000-Piece Mountain Landscape",
    "AquaBlast Water Blaster - Twin Pack",
    "MathMakers Wooden Counting Board",
    "GalaxyExplorer Telescope for Kids",
    "DoughWorks Modeling Clay Studio",
    "MiniChef Play Kitchen Accessory Set",
    "CodeBot Screen-Free Coding Robot",
    "BouncePro Indoor Mini Trampoline",
  ],
};

const AUTHORS = [
  "Maya R.", "Jordan T.", "Sam K.", "Priya N.", "Alex M.", "Casey L.",
  "Robin D.", "Jamie P.", "Taylor W.", "Morgan S.", "Avery B.", "Quinn H.",
];

const REVIEW_BODIES: Record<string, string[]> = {
  high: [
    "Exceeded my expectations. Build quality is excellent and it arrived earlier than estimated.",
    "Exactly as described. I have been using it daily for a month with zero complaints.",
    "Great value for the price. Would absolutely buy again and have already recommended it.",
    "Solid purchase. Does exactly what it promises and the quality feels premium.",
  ],
  mid: [
    "Pretty good overall. A couple of minor quirks but nothing that affects daily use.",
    "Does the job well enough. Not perfect, but fair for the price point.",
    "Decent quality. Shipping took a bit longer than expected but the item itself is fine.",
  ],
  low: [
    "Expected a bit more for the price. It works, but the finish feels cheaper than the photos.",
    "Mixed feelings. Some parts are great, others feel like an afterthought.",
  ],
};

function buildProducts() {
  return Object.entries(CATALOG).flatMap(([category, titles]) =>
    titles.map((title) => {
      const slug = slugify(title);
      return {
        title,
        slug,
        description: `${title} - a customer favorite in our ${category} range. Ships free with hassle-free returns within 30 days.`,
        priceCents: int(999, 24999),
        images: [
          `https://picsum.photos/seed/${slug}/640/480`,
          `https://picsum.photos/seed/${slug}-alt/640/480`,
        ],
        category,
        stock: int(0, 60),
      };
    })
  );
}

function buildReviews() {
  return buildProducts().map((product) => {
    const count = int(2, 4);
    const ratings = Array.from({ length: count }, () => {
      const roll = rng();
      return roll < 0.55 ? int(4, 5) : roll < 0.9 ? 3 : int(1, 2);
    });
    const reviews = ratings.map((rating) => ({
      authorName: pick(AUTHORS),
      rating,
      body:
        rating >= 4
          ? pick(REVIEW_BODIES.high)
          : rating === 3
            ? pick(REVIEW_BODIES.mid)
            : pick(REVIEW_BODIES.low),
    }));
    return { product, reviews };
  });
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  // Re-runnable: wipe catalog + reviews, then insert the deterministic set.
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();

  const entries = buildReviews();
  for (const { product, reviews } of entries) {
    const reviewCount = reviews.length;
    const rating =
      Math.round(
        (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10
      ) / 10;
    await prisma.product.create({
      data: {
        ...product,
        rating,
        reviewCount,
        reviews: { create: reviews },
      },
    });
  }

  const [products, reviewCount] = await Promise.all([
    prisma.product.count(),
    prisma.review.count(),
  ]);
  const perCategory = await prisma.product.groupBy({
    by: ["category"],
    _count: true,
  });
  const samples = await prisma.product.findMany({
    where: { category: { in: ["Electronics", "Toys"] } },
    select: { slug: true, rating: true, reviewCount: true },
    take: 2,
  });

  console.log(`Seeded ${products} products, ${reviewCount} reviews`);
  console.log("Per category:", perCategory.map((c) => `${c.category}=${c._count}`).join(", "));
  console.log("Samples:", samples.map((s) => s.slug).join(", "));
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
