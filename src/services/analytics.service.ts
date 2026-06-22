import { StallModel, MenuItemModel, ReviewModel } from "../models";

const itemProjectionFields = {
  description: 1,
  ingredients: 1,
  allergens: 1,
  nutrition: 1,
  photoUrl: 1
};

const stallProjectionFields = {
  description: 1,
  location: 1,
  openingHours: 1,
  photoUrl: 1
};

export async function getTopRatedStalls(limit = 3) {
  return StallModel.aggregate([
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "stallId",
        as: "reviews"
      }
    },
    {
      $addFields: {
        rating: {
          $cond: [
            { $gt: [{ $size: "$reviews" }, 0] },
            { $avg: "$reviews.rating" },
            0
          ]
        },
        reviewCount: { $size: "$reviews" }
      }
    },
    { $match: { isActive: true, reviewCount: { $gt: 0 } } },
    { $sort: { rating: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        name: 1,
        rating: { $round: ["$rating", 1] },
        reviewCount: 1,
        ...stallProjectionFields
      }
    }
  ]);
}

export async function getTopRatedItems(limit = 3) {
  return MenuItemModel.aggregate([
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "menuItemId",
        as: "reviews"
      }
    },
    {
      $addFields: {
        rating: {
          $cond: [
            { $gt: [{ $size: "$reviews" }, 0] },
            { $avg: "$reviews.rating" },
            0
          ]
        },
        reviewCount: { $size: "$reviews" }
      }
    },
    { $match: { isAvailable: true, reviewCount: { $gt: 0 } } },
    { $sort: { rating: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        name: 1,
        price: 1,
        rating: { $round: ["$rating", 1] },
        reviewCount: 1,
        ...itemProjectionFields
      }
    }
  ]);
}

export async function getMostPopularItems(limit = 3) {
  return MenuItemModel.aggregate([
    {
      $lookup: {
        from: "favorites",
        localField: "_id",
        foreignField: "targetId",
        as: "favorites"
      }
    },
    {
      $addFields: {
        viewCount: { $ifNull: ["$viewCount", 0] },
        favoriteCount: { $size: "$favorites" }
      }
    },
    { $match: { isAvailable: true } },
    { $sort: { favoriteCount: -1, viewCount: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        name: 1,
        price: 1,
        favoriteCount: 1,
        viewCount: 1,
        ...itemProjectionFields
      }
    }
  ]);
}

export async function getTrendingThisWeek(limit = 3) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  return MenuItemModel.aggregate([
    {
      $lookup: {
        from: "reviews",
        let: { menuItemId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$menuItemId", "$$menuItemId"] },
              createdAt: { $gte: weekAgo }
            }
          }
        ],
        as: "recentReviews"
      }
    },
    {
      $addFields: {
        recentReviewCount: { $size: "$recentReviews" }
      }
    },
    { $match: { isAvailable: true, recentReviewCount: { $gt: 0 } } },
    { $sort: { recentReviewCount: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        name: 1,
        price: 1,
        recentReviewCount: 1,
        ...itemProjectionFields
      }
    }
  ]);
}

export async function getMostFavoritedStalls(limit = 3) {
  return StallModel.aggregate([
    {
      $lookup: {
        from: "favorites",
        let: { stallId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$targetId", "$$stallId"] },
              targetType: "stall"
            }
          }
        ],
        as: "favorites"
      }
    },
    {
      $addFields: {
        favoriteCount: { $size: "$favorites" }
      }
    },
    { $match: { isActive: true, favoriteCount: { $gt: 0 } } },
    { $sort: { favoriteCount: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        name: 1,
        favoriteCount: 1,
        ...stallProjectionFields
      }
    }
  ]);
}

export async function getMostFavoritedItems(limit = 3) {
  return MenuItemModel.aggregate([
    {
      $lookup: {
        from: "favorites",
        let: { itemId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$targetId", "$$itemId"] },
              targetType: "item"
            }
          }
        ],
        as: "favorites"
      }
    },
    {
      $addFields: {
        favoriteCount: { $size: "$favorites" }
      }
    },
    { $match: { isAvailable: true, favoriteCount: { $gt: 0 } } },
    { $sort: { favoriteCount: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        name: 1,
        price: 1,
        favoriteCount: 1,
        ...itemProjectionFields
      }
    }
  ]);
}

export async function getCheapestItems(limit = 3) {
  return MenuItemModel.aggregate([
    { $match: { isAvailable: true } },
    { $sort: { price: 1 } },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        name: 1,
        price: 1,
        category: 1,
        ...itemProjectionFields
      }
    }
  ]);
}

export async function getBestValue(limit = 3) {
  return MenuItemModel.aggregate([
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "menuItemId",
        as: "reviews"
      }
    },
    {
      $addFields: {
        rating: {
          $cond: [
            { $gt: [{ $size: "$reviews" }, 0] },
            { $avg: "$reviews.rating" },
            0
          ]
        },
        reviewCount: { $size: "$reviews" }
      }
    },
    {
      $addFields: {
        valueScore: {
          $cond: [
            { $gt: ["$price", 0] },
            { $divide: ["$rating", { $max: ["$price", 1] }] },
            0
          ]
        }
      }
    },
    { $match: { isAvailable: true, reviewCount: { $gt: 0 } } },
    { $sort: { valueScore: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        name: 1,
        price: 1,
        rating: { $round: ["$rating", 1] },
        reviewCount: 1,
        ...itemProjectionFields
      }
    }
  ]);
}

export async function getMostReviewedStalls(limit = 3) {
  return StallModel.aggregate([
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "stallId",
        as: "reviews"
      }
    },
    {
      $addFields: {
        reviewCount: { $size: "$reviews" }
      }
    },
    { $match: { isActive: true, reviewCount: { $gt: 0 } } },
    { $sort: { reviewCount: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        name: 1,
        reviewCount: 1,
        ...stallProjectionFields
      }
    }
  ]);
}

export async function getNewArrivals(limit = 3) {
  return MenuItemModel.aggregate([
    { $match: { isAvailable: true } },
    { $sort: { createdAt: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        name: 1,
        price: 1,
        category: 1,
        createdAt: 1,
        ...itemProjectionFields
      }
    }
  ]);
}
