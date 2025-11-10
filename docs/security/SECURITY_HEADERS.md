# Recommended Security Headers for Production

Implementing appropriate HTTP security headers is crucial for protecting web applications against common vulnerabilities and enhancing user privacy. These headers instruct browsers on how to handle your site's content, adding an essential layer of defense.

## Key Security Headers

Here are the most recommended security headers for production environments:

### 1. Strict-Transport-Security (HSTS)

*   **Purpose**: Forces browsers to interact with your site only over HTTPS, preventing unencrypted HTTP communication. This mitigates man-in-the-middle (MITM) attacks and ensures all communication is encrypted.
*   **Example**:
    ```
    Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
    ```
*   **Explanation**:
    *   `max-age`: The time (in seconds) that the browser should remember to access the site only using HTTPS. `31536000` seconds equals 1 year.
    *   `includeSubDomains`: Applies the HSTS policy to all subdomains of the current domain.
    *   `preload`: Allows the domain to be included in the browser's HSTS preload list, providing protection even on the first visit. (Requires submission to the preload list).

### 2. Content-Security-Policy (CSP)

*   **Purpose**: A powerful header that provides granular control over the resources (scripts, styles, images, etc.) a web application can load. By defining a whitelist of trusted sources, CSP effectively defends against Cross-Site Scripting (XSS) and other code injection attacks.
*   **Example**:
    ```
    Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted.cdn.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws://*.example.com;
    ```
*   **Explanation**:
    *   `default-src 'self'`: Default policy for all resource types, restricting them to the same origin as the document.
    *   `script-src`: Specifies valid sources for JavaScript.
    *   `style-src`: Specifies valid sources for stylesheets. `'unsafe-inline'` is often needed for legacy CSS but should be avoided if possible.
    *   `img-src`: Specifies valid sources for images. `data:` allows data URIs for images.
    *   `connect-src`: Restricts URLs that can be loaded using script interfaces (e.g., `fetch`, `XMLHttpRequest`, `WebSocket`).
*   **Note**: CSP can be complex to implement correctly. Start with a reporting-only mode (`Content-Security-Policy-Report-Only`) to monitor violations before enforcing.

### 3. X-Content-Type-Options

*   **Purpose**: Prevents browsers from "MIME sniffing" a response away from the declared content-type. This can mitigate security risks where a browser might interpret a file (e.g., an uploaded image) as an executable script.
*   **Example**:
    ```
    X-Content-Type-Options: nosniff
    ```
*   **Explanation**:
    *   `nosniff`: Instructs the browser to strictly follow the `Content-Type` header provided by the server.

### 4. X-Frame-Options

*   **Purpose**: Protects against clickjacking attacks by indicating whether a browser should be allowed to render a page in a `<frame>`, `<iframe>`, `<embed>`, or `<object>`.
*   **Example**:
    ```
    X-Frame-Options: DENY
    ```
    or
    ```
    X-Frame-Options: SAMEORIGIN
    ```
*   **Explanation**:
    *   `DENY`: The page cannot be displayed in a frame, regardless of the site attempting to do so.
    *   `SAMEORIGIN`: The page can only be displayed in a frame on the same origin as the page itself.
*   **Note**: For modern browsers, the `frame-ancestors` directive in CSP can achieve similar or more granular control and is generally preferred.

### 5. Referrer-Policy

*   **Purpose**: Controls how much referrer information is sent with requests, helping to prevent information leakage.
*   **Example**:
    ```
    Referrer-Policy: strict-origin-when-cross-origin
    ```
*   **Explanation**:
    *   `strict-origin-when-cross-origin`: Sends the full URL as a referrer when performing a same-origin request, but only sends the origin when the protocol security level stays the same (HTTPS to HTTPS) or improves (HTTP to HTTPS) when making cross-origin requests. No referrer is sent to less secure destinations (HTTPS to HTTP).

### 6. Permissions-Policy (formerly Feature-Policy)

*   **Purpose**: Allows you to selectively enable or disable browser features (like camera, microphone, or geolocation) for your website and its embedded content, enhancing user privacy and security.
*   **Example**:
    ```
    Permissions-Policy: geolocation=(self "https://example.com"), camera=()
    ```
*   **Explanation**:
    *   `geolocation=(self "https://example.com")`: Allows geolocation access only to the site's own origin and `https://example.com`.
    *   `camera=()`: Disables camera access for all origins.

### 7. Cross-Origin-Opener-Policy (COOP)

*   **Purpose**: Helps isolate your document from other origins to protect against attacks like Spectre. It specifies whether a top-level document can share a browsing context with cross-origin documents.
*   **Example**:
    ```
    Cross-Origin-Opener-Policy: same-origin
    ```
*   **Explanation**:
    *   `same-origin`: Isolates the browsing context exclusively to same-origin documents. Cross-origin windows will not share the same browsing context.

### 8. Cross-Origin-Embedder-Policy (COEP)

*   **Purpose**: Works with COOP to ensure that a document can only embed resources that explicitly opt-in to be embedded, further protecting against side-channel attacks.
*   **Example**:
    ```
    Cross-Origin-Embedder-Policy: require-corp
    ```
*   **Explanation**:
    *   `require-corp`: A document can only load resources from the same origin, or resources explicitly marked as loadable from another origin.

### 9. Cross-Origin-Resource-Policy (CORP)

*   **Purpose**: Prevents other websites from hotlinking your resources, protecting against data leakage and ensuring resources are only loaded from expected origins.
*   **Example**:
    ```
    Cross-Origin-Resource-Policy: same-origin
    ```
*   **Explanation**:
    *   `same-origin`: Resource can only be loaded from the same origin.
    *   `same-site`: Resource can be loaded from the same site.
    *   `cross-origin`: Resource can be loaded from any origin.

### 10. Set-Cookie Attributes (Secure, HttpOnly, SameSite)

*   **Purpose**: While not a standalone header, these attributes within the `Set-Cookie` HTTP response header are critical for cookie security.
*   **Example**:
    ```
    Set-Cookie: sessionid=abcdef123; Secure; HttpOnly; SameSite=Lax
    ```
*   **Explanation**:
    *   `Secure`: Ensures the cookie is only sent over HTTPS connections.
    *   `HttpOnly`: Prevents client-side scripts from accessing the cookie, mitigating XSS risks.
    *   `SameSite`: Controls how cookies are sent in cross-site requests, protecting against Cross-Site Request Forgery (CSRF).
        *   `Lax`: Cookies are sent with top-level navigations and will be sent with GET requests.
        *   `Strict`: Cookies are only sent in a first-party context.
        *   `None`: Cookies are sent in all contexts, but requires `Secure`.

## Implementation Notes

*   **Server-Side Configuration**: Most of these headers are configured on your web server (e.g., Nginx, Apache) or application framework.
*   **Customization**: Headers like CSP and Permissions-Policy require careful customization to your application's specific needs. Overly strict policies can break functionality, while overly lenient ones reduce security benefits.
*   **Testing**: Always test changes to security headers thoroughly in a staging environment before deploying to production.
*   **OWASP**: Refer to the [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/) for the latest recommendations and detailed guidance.
