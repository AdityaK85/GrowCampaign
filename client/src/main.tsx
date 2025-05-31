import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set page title
document.title = "GrowCampaign - Discover Ideas";

// Set meta description
const metaDescription = document.createElement('meta');
metaDescription.name = 'description';
metaDescription.content = 'Discover and share visual ideas that inspire. Create beautiful posts, connect with creators, and find trending content on GrowCampaign.';
document.head.appendChild(metaDescription);

// Set Open Graph tags
const ogTitle = document.createElement('meta');
ogTitle.property = 'og:title';
ogTitle.content = 'GrowCampaign - Discover Ideas';
document.head.appendChild(ogTitle);

const ogDescription = document.createElement('meta');
ogDescription.property = 'og:description';
ogDescription.content = 'Discover and share visual ideas that inspire. Create beautiful posts, connect with creators, and find trending content.';
document.head.appendChild(ogDescription);

const ogType = document.createElement('meta');
ogType.property = 'og:type';
ogType.content = 'website';
document.head.appendChild(ogType);

createRoot(document.getElementById("root")!).render(<App />);
