export function success(res, data, meta = {}) {
  return res.json({
    success: true,
    data,
    ...(Object.keys(meta).length ? { meta } : {}),
  });
}

export function created(res, data) {
  return res.status(201).json({
    success: true,
    data,
  });
}

export function error(res, message, statusCode = 500, details = null) {
  const body = {
    success: false,
    error: message,
  };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
}
