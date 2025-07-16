import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    return;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname.startsWith("/upload")) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/upload/:path*", "/api/uploadthing/:path*"],
};