
{ pkgs }: {
  deps = [
    pkgs.nodejs-20_x
    pkgs.nodePackages.typescript-language-server
    pkgs.chromium
    pkgs.glib
    pkgs.gobject-introspection
    pkgs.cairo
    pkgs.pango
    pkgs.gtk3
    pkgs.gdk-pixbuf
    pkgs.libxshmfence
    pkgs.nss
    pkgs.nspr
    pkgs.atk
    pkgs.cups
    pkgs.gtk3
    pkgs.libdrm
    pkgs.libxcomposite
    pkgs.libxdamage
    pkgs.libxrandr
    pkgs.mesa
    pkgs.expat
    pkgs.libxss
    pkgs.libasound2-dev
  ];
}
