# Warhammer Battle HUD (`warhammer-battle-hud`)

[English](README.md) | **Polski**

Wszystko, czego postać potrzebuje w walce, na jednym ekranie i bez dodatkowych modułów: ramki drużyny, panel akcji i pasek amunicji. Moduł wykrywa aktywny system Warhammera.

Wymaga **Foundry VTT v14** i jednego z systemów: **WFRP 4e / 5e** (`wfrp4e` 10.0+), **The Old World** (`whtow`), **Imperium Maledictum** (`impmal`), **Wrath & Glory** (`wrath-and-glory`), **Soulbound** (`age-of-sigmar-soulbound`).

Nie włączaj go razem ze starszymi modułami *Warhammer Party Frames*, *Warhammer Ammo & Quick Gear* i *WFRP4e – Action HUD*, które zastępuje.

## 📥 Instalacja

Wklej w *Manifest URL* w **Dodatki → Zainstaluj moduł**:

```
https://github.com/TomasWarchol/warhammer-battle-hud/releases/latest/download/module.json
```

## ⚔️ Panel akcji

Zakładki nad paskiem makr dla zaznaczonego tokena albo przypisanej postaci. W WFRP: cechy, umiejętności, walka, magia, religia, talenty, stany i Przewaga. W pozostałych systemach: testy systemu z wartościami postaci.

* **Lewy klik**: rzut, dodanie stanu lub Przewagi, talent na czat.
* **Prawy klik**: arkusz przedmiotu, zdjęcie stanu lub Przewagi.
* **Shift**: tajny rzut MG. **Alt**: pominięcie okna rzutu. **Ctrl + lewy / prawy** na broni i pancerzu: naprawa / uszkodzenie.

## 🏹 Amunicja

W systemach, które ją śledzą (WFRP, Imperium Maledictum, Wrath & Glory): wybór amunicji, przeładowanie i zakładanie broni lub tarczy jednym kliknięciem. Licznik robi się bursztynowy przy małej ilości i czerwony przy braku.

## 🖼️ Ramki drużyny

Portret, zdrowie, zasoby systemu i stany każdej postaci. **Klik** wskazuje cel, **podwójny klik** przechodzi do tokena, **prawy klik** otwiera kartę. Nagłówek przełącza Drużynę, Walkę i Zaznaczone tokeny, zwija ramki i przesuwa je po przeciągnięciu.

## 🎯 Token HUD

Cztery szybkie testy z wartościami na HUD tokena. Każdą część można wyłączyć w ustawieniach.

## 🌐 Języki

Angielski i polski są wbudowane. Aby dodać kolejny język:

```bash
npm run lang:add -- de "Deutsch"
```

## 📄 Licencja

MIT – zobacz [LICENSE](LICENSE).

Nieoficjalna twórczość fanowska, niezwiązana z Games Workshop ani Cubicle 7 i przez nie niepopierana. Warhammer i powiązane nazwy są znakami towarowymi Games Workshop Limited. Moduł nie zawiera tekstów ani grafik z podręczników – działa z treściami, które już posiadasz.
