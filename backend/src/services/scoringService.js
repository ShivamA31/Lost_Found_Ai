const env = require('../config/env');

function haversineDistance(coords1, coords2) {
  function toRad(x) {
    return x * Math.PI / 180;
  }
  const R = 6371; // km
  const x1 = coords2.lat - coords1.lat;
  const dLat = toRad(x1);
  const x2 = coords2.lng - coords1.lng;
  const dLon = toRad(x2)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coords1.lat)) * Math.cos(toRad(coords2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d * 1000; // in meters
}

exports.calculateScore = (lostItem, foundItem, semanticScore) => {
  let categoryScore = 0;
  let locationScore = 0;
  let dateScore = 0;
  let colorScore = 0;
  const reasons = [];

  // Semantic
  reasons.push(`Semantic match: ${Math.round(semanticScore * 100)}%`);

  // Category (15%)
  if (lostItem.category_id && foundItem.category_id) {
    if (lostItem.category_id === foundItem.category_id) {
      categoryScore = 1;
      reasons.push("Same category");
    } else {
      reasons.push("Different categories");
    }
  } else {
    // missing category
    categoryScore = 0;
  }

  // Location (10%)
  if (lostItem.latitude && lostItem.longitude && foundItem.latitude && foundItem.longitude) {
    const dist = haversineDistance(
      { lat: lostItem.latitude, lng: lostItem.longitude },
      { lat: foundItem.latitude, lng: foundItem.longitude }
    );
    if (dist <= 50) {
      locationScore = 1;
    } else if (dist >= 1000) {
      locationScore = 0;
    } else {
      locationScore = 1 - ((dist - 50) / 950);
    }
    reasons.push(`Within ${Math.round(dist)}m of each other`);
  } else if (lostItem.location_id && foundItem.location_id) {
    if (lostItem.location_id === foundItem.location_id) {
      // 10 is 'Other' in seed.sql usually, but we can do a name check if joined
      // Assuming we just check ID
      locationScore = 1;
      reasons.push("Same location zone");
    } else {
      locationScore = 0;
    }
  } else {
    locationScore = 0;
  }

  // Date (10%)
  if (lostItem.date_occurred && foundItem.date_occurred) {
    const lostDate = new Date(lostItem.date_occurred);
    const foundDate = new Date(foundItem.date_occurred);
    const diffTime = foundDate - lostDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays < -1) {
      // Found more than 1 day before it was lost
      dateScore = 0;
      reasons.push("Found before it was lost");
    } else {
      // 0 or positive days (with 1 day grace)
      const effectiveDays = Math.max(0, diffDays);
      dateScore = Math.exp(-effectiveDays / 7);
      if (effectiveDays <= 1) {
        reasons.push("Dates match closely");
      } else {
        reasons.push(`Found ${Math.round(effectiveDays)} days later`);
      }
    }
  }

  // Color (5%)
  if (lostItem.color && foundItem.color) {
    if (lostItem.color === foundItem.color) {
      colorScore = 1;
      reasons.push(`Same color: ${lostItem.color}`);
    } else {
      colorScore = 0;
    }
  } else {
    colorScore = 0.5; // one or both unknown
  }

  // 60% semantic + 15% category + 10% location + 10% date + 5% color
  const finalScore = (0.60 * semanticScore) + (0.15 * categoryScore) + (0.10 * locationScore) + (0.10 * dateScore) + (0.05 * colorScore);

  return {
    finalScore,
    semanticScore,
    categoryScore,
    locationScore,
    dateScore,
    colorScore,
    reasons
  };
};
