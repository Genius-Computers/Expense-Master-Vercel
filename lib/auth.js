// Auth middleware helper
export function getAuthUser(req) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers.auth;
    
    if (!token) {
      return null;
    }

    const userData = JSON.parse(Buffer.from(token, 'base64').toString());
    return userData;
  } catch (error) {
    return null;
  }
}

export function requireAuth(req) {
  const user = getAuthUser(req);
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}


