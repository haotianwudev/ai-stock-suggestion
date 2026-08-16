// Centralized tier thresholds for engagement likes and donation promotion.
// Mirrors LIKE_THRESHOLDS and DONATION_THRESHOLDS_CENTS in client src/lib/tiers.ts.

const LIKE_THRESHOLDS = {
  TIER_3: 1,
  TIER_4: 10,
  TIER_5: 50,
  TIER_6: 200,
  TIER_7: 400,
};

const DONATION_THRESHOLDS_CENTS = {
  TIER_4: 999,   // $9.99
  TIER_5: 2999,  // $29.99
  TIER_6: 9999,  // $99.99
  TIER_7: 19999, // $199.99
};

const MIN_MODERATOR_TIER = 8;
const ADMIN_TIER = 9;

module.exports = {
  LIKE_THRESHOLDS,
  DONATION_THRESHOLDS_CENTS,
  MIN_MODERATOR_TIER,
  ADMIN_TIER,
};
