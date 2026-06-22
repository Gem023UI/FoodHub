export interface MongoServerErrorLike {
  code?: number;
}

export function isMongoServerError(error: unknown): error is MongoServerErrorLike {
  return typeof error === "object" && error !== null && "code" in error;
}