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
- appka teraz zoberie prvych 5 YouTube vysledkov a skusa ich embedovat jeden po
  druhom (YT.Player, cez youtube-nocookie.com, s origin parametrom kvoli chybe
  150 na produkcnych domenach) - ak jeden zlyha (napr. embedovanie zakazane
  vlastnikom), skusi sa dalsi, az kym jeden nefunguje alebo sa minu vsetky; vzdy
  je viditelny aj zalozny odkaz "Otvor priamo na YouTube"
- na UI je debug log panel (posledne akcie hladania/embedovania s casovou
  znackou), aby sa dalo diagnostikovat na diaľku bez SSH na server; server tiez
  loguje detailne (YouTube pocet vysledkov, lyrics.ovh status, atd.)
- staticke .js/.css/.html subory maju Cache-Control: no-cache, aby sa po
  nasadeni novej verzie nemuselo cakat na vyprsanie cache v prehliadaci
- pri kazdom vynechanom slove v hre appka (volitelne, ak je nastaveny
  ANTHROPIC_API_KEY) zobrazi maly slovensky prekladovy hint LEN pre to jedno
  slovo/kratku frazu (napr. "💡 nádej") - NIE preklad celej piesne. Zvazovali
  sme aj cely druhy stlpec s kompletnym prekladom textu, ale to by bola
  systematicka plna reprodukcia (odvodene dielo) chraneneho textu pre
  lubovolnu piesen, comu sme sa chceli vyhnut. Preklady jednotlivych slov su
  cachovane v pamati servera (naprieč piesnami), aby sa rovnake slovo
  neprekladalo cez API opakovane. Bez API kluca appka funguje normalne, len
  bez tychto hintov

TODO:
1. presnejsie parovanie YouTube vysledku s hladanou pesnickou (yt-search niekedy
   vrati iny song od toho isteho interpreta)
2. moznost vybrat si z viacerych YouTube vysledkov rucne, nie len automaticky
   postupne skusat prvych 5
3. tazsie/lahsie urovne obtiaznosti (menej/viac vynechanych slov na strofu)
