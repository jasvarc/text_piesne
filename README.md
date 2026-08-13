# text_piesne

hra pre deti "dopln slovo do textu piesne" - napises interpreta/nazov, appka
najde video na YouTube a text piesne, a dieta na viacerych miestach v texte
vyberie z 3 slov to spravne (klikanim, netreba pisat)

DONE:
- zakladny web: formular na interpreta a/alebo nazov piesne, tlacidlo "Najst pieseň"
- vyhladanie na YouTube cez kniznicu yt-search (bez API kluca) - najde a zobrazi
  vlozene video (embed)
- text piesne sa hlada cez verejne API api.lyrics.ovh (bez API kluca)
- appka rozdeli text na strofy (podla prazdnych riadkov) a v kazdej strofe vynecha
  slovo priblizne kazde 2 versy (riadky), minimalne vsak jedno slovo na strofu/refren
- kazde vynechane slovo ma namiesto textoveho policka 3 klikatelne moznosti (spravne
  slovo + 2 nespravne) - nespravna volba sa oznaci a zablokuje, dieta skusi dalsiu,
  spravna volba slovo v texte natrvalo odkryje zelenou farbou; hore sa priebezne
  zobrazuje pocitadlo "Vyriesene: X / Y" a po dokonceni vsetkych hlaska "🎉"
- nespravne moznosti (distraktory) sa berú z ostatnych slov v tej istej piesni,
  doplnene o male zalozne slovnik beznych anglickych slov (pre pripad kratkeho textu)
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
3. tazsie/lahsie urovne obtiaznosti (menej/viac vynechanych slov na strofu)
