# text_piesne

hra "dopln slovo do textu piesne" - napises interpreta/nazov, appka najde video na
YouTube a text piesne, a das doplnit jedno nahodne vynechane slovo

DONE:
- zakladny web: formular na interpreta a/alebo nazov piesne, tlacidlo "Najst pieseň"
- vyhladanie na YouTube cez kniznicu yt-search (bez API kluca) - najde a zobrazi
  vlozene video (embed)
- text piesne sa hlada cez verejne API api.lyrics.ovh (bez API kluca) - ak sa najde,
  appka nahodne vyberie jedno slovo (min. 4 pismena) a nahradi ho v texte za "_____"
- hrac napise svoj tip a tlacidlom "Skontrolovat" sa overi (bez ohladu na velke/male
  pismena a diakritiku); pri spravnej odpovedi sa slovo v texte odkryje
- ak sa video na YouTube vobec nenajde, appka to napise a ponukne tlacidlo
  "Skusit znova" (formular ostava prazdny na novy pokus)
- ak sa video najde, ale text piesne sa nepodari najst (bezne najma pri
  slovenskych/menej znamych pesnickach), appka to oznaci a aspon ponuka video na
  vypocutie, bez dopĺňacej hry
- tlacidlo "Nova pieseň" vycisti formular a vrati na zaciatok
- appka je vedome zamerana len na anglicke piesne (UI to hovori uz vo formulari aj
  v hlaske pri nenajdenom texte) - zvazovali sme scraping slovenskych/ceskych
  lyric webov (karaoketexty.cz, supermusic.cz) ako zdroj pre SK/CZ piesne, ale
  ich vlastne podmienky pouzitia/copyright poznamky explicitne priznavaju, ze
  nemaju prava obsah dalej sirit, takze sme sa rozhodli to nerobit

TODO:
1. presnejsie parovanie YouTube vysledku s hladanou pesnickou (yt-search niekedy
   vrati iny song od toho isteho interpreta)
2. moznost vybrat si z viacerych YouTube vysledkov, nie len automaticky prvy
3. tazsi rezim: vynechat viac slov naraz alebo cele frazy
