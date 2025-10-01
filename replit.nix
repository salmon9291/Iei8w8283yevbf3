
{ pkgs }: {
  deps = [
    pkgs.nodejs-20_x
    pkgs.nodePackages.typescript-language-server
    pkgs.chromium
    pkgs.nss
    pkgs.freetype
    pkgs.freetype.dev
    pkgs.fontconfig
    pkgs.fontconfig.dev
    pkgs.libxss
    pkgs.glib
    pkgs.gtk3
    pkgs.atk
    pkgs.gdk-pixbuf
    pkgs.cairo
    pkgs.pango
  ];
  
  env = {
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "true";
    PUPPETEER_EXECUTABLE_PATH = "${pkgs.chromium}/bin/chromium";
  };
}
