export const formatPrisma = (obj: any) => {
  const res: any = {};
  for (const key in obj) {
    if (key == '_id') res.id = obj._id.$oid;
    else if (obj[key].$oid) res[key] = obj[key].$oid;
    else if (obj[key].$date) res[key] = obj[key].$date;
    else if (Array.isArray(obj[key]))
      res[key] = obj[key]
        .filter((formatted) => typeof formatted != 'object' || formatted?._id)
        .map((obj) => formatPrisma(obj));
    else if (typeof obj[key] != 'object') res[key] = obj[key];
    else res[key] = formatPrisma(obj[key]);
  }
  return res;
};
