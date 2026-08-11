from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "Calc.ico"
DESKTOP_BUILD = ROOT / "desktop" / "build"
LINUX_ICONS = DESKTOP_BUILD / "icons"


def square_icon(image: Image.Image, size: int) -> Image.Image:
    return image.resize((size, size), Image.Resampling.LANCZOS)


def write_desktop_icons(image: Image.Image) -> None:
    LINUX_ICONS.mkdir(parents=True, exist_ok=True)
    for size in (16, 32, 48, 64, 128, 256, 512, 1024):
        square_icon(image, size).save(LINUX_ICONS / f"{size}x{size}.png")

    square_icon(image, 1024).save(
        DESKTOP_BUILD / "Calc.icns",
        format="ICNS",
        append_images=[square_icon(image, size) for size in (16, 32, 64, 128, 256, 512)],
    )


def write_android_icons(image: Image.Image) -> None:
    resources = ROOT / "android" / "app" / "src" / "main" / "res"
    if not resources.exists():
        return

    launcher_sizes = {
        "mdpi": 48,
        "hdpi": 72,
        "xhdpi": 96,
        "xxhdpi": 144,
        "xxxhdpi": 192,
    }
    for density, size in launcher_sizes.items():
        target = resources / f"mipmap-{density}"
        target.mkdir(parents=True, exist_ok=True)
        square_icon(image, size).save(target / "ic_launcher.png")
        square_icon(image, size).save(target / "ic_launcher_round.png")
        square_icon(image, round(size * 2.25)).save(target / "ic_launcher_foreground.png")


def main() -> None:
    with Image.open(SOURCE) as source:
        source.seek(source.n_frames - 1 if getattr(source, "n_frames", 1) > 1 else 0)
        image = source.convert("RGBA")

    write_desktop_icons(image)
    write_android_icons(image)


if __name__ == "__main__":
    main()
