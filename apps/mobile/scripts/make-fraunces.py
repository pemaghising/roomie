"""Builds the static Fraunces 72pt Soft SemiBold (roman + italic) the app's titles use.

Google Fonts ships Fraunces only as a variable font, so the Figma style
(opsz 72, SOFT 100, WONK 0, weight 600) is instanced here with fontTools.
Usage: python scripts/make-fraunces.py <dir with Fraunces[...].ttf and Fraunces-Italic[...].ttf>
"""
import sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

AXES = {"opsz": 72, "wght": 600, "SOFT": 100, "WONK": 0}
src = Path(sys.argv[1])
out = Path(__file__).resolve().parent.parent / "assets" / "fonts"
out.mkdir(parents=True, exist_ok=True)

for source, style, target in (("Fraunces.ttf", "SemiBold", "Fraunces72Soft-SemiBold.ttf"),
                              ("Fraunces-Italic.ttf", "SemiBold Italic", "Fraunces72Soft-SemiBoldItalic.ttf")):
    font = instantiateVariableFont(TTFont(src / source), AXES, inplace=False, updateFontNames=False)
    names = font["name"]
    names.setName("Fraunces 72pt Soft", 1, 3, 1, 0x409)
    names.setName(style, 2, 3, 1, 0x409)
    names.setName(f"Fraunces 72pt Soft {style}", 4, 3, 1, 0x409)
    names.setName(f"Fraunces72Soft-{style.replace(' ', '')}", 6, 3, 1, 0x409)
    font.save(out / target)
    print(target, (out / target).stat().st_size // 1024, "KB")
