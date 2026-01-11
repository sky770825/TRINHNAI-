import { useEffect } from "react";

export const StructuredData = () => {
  useEffect(() => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "BeautySalon",
      "name": "Trinhnai 全方位美學沙龍",
      "description": "讓妳的美，成為日常的儀式感。Trinhnai 提供專業美甲、美睫、半永久紋繡、熱蠟除毛服務。使用日本進口材料，醫療級消毒標準。中壢在地美學沙龍首選。",
      "url": "https://trinhnai-342f2e80.vercel.app/",
      "telephone": "+886-3-XXXX-XXXX",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "中壢",
        "addressRegion": "桃園市",
        "addressCountry": "TW"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "24.9650",
        "longitude": "121.2175"
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
          ],
          "opens": "09:00",
          "closes": "22:00"
        }
      ],
      "priceRange": "$$",
      "servesCuisine": "美甲、美睫、紋繡、熱蠟除毛",
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "服務項目",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "美甲服務",
              "description": "專業美甲、光療指甲、指甲彩繪"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "美睫服務",
              "description": "專業美睫、睫毛延伸"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "紋繡服務",
              "description": "半永久紋繡、霧眉"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "熱蠟除毛服務",
              "description": "專業除毛服務"
            }
          }
        ]
      },
      "sameAs": [
        "https://www.instagram.com/trinhnai",
        "https://www.facebook.com/trinhnai"
      ]
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(structuredData);
    script.id = "structured-data";
    
    // Remove existing structured data if any
    const existing = document.getElementById("structured-data");
    if (existing) {
      existing.remove();
    }
    
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById("structured-data");
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, []);

  return null;
};
