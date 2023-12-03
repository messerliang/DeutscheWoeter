const B1E10 = [
	{chinese:"城市",type:"nom", gender:"die", word:"Stadt", plural:"Städte", example:"Hangzhou ist die shönste Stadt in China", },
	{chinese:"桥",type:"nom", gender:"die", word:"Brücke", plural:"Brücken", example:"Das Bus hält an der Brücke", },
	{chinese:"市政厅，市政府",type:"nom", gender:"das", word:"Rathaus", plural:"Rathäuser", example:"Gegenüber dem Rathaus ist die Kirche", },
	{chinese:"地铁",type:"nom", gender:"die", word:"U-Bahn", plural:"U-Bahnen", example:"Sie fährt jeden Tag mit der U-Bahn zur Arbeit", },
	{chinese:"教堂，教会",type:"nom", gender:"die", word:"Kirche", plural:"Kirchen", example:"Die Kirche liegt hinter dem Markplatz", },
	{chinese:"邮政总局",type:"nom", gender:"die", word:"Hauptpost", plural:"o.Pl", example:"Die Hauptpost liegt in der Nähe des Marktplatzes", },
	{chinese:"十字路口",type:"nom", gender:"die", word:"Kreuzung", plural:"Kreuzungen", example:"An der Kreuzung der Beliner Straße und der Giether Straße liegt das große Kaufhaus", },
	{chinese:"街道",type:"nom", gender:"die", word:"Straße", plural:"Streßen", example:"Wang Hongliang wohnt in der Kreuzbergstraße", },
	{chinese:"河流",type:"nom", gender:"der", word:"Fluss", plural:"Flüsse", example:"Der Changjiang ist der längste Fluss in China", },
	{chinese:"问询处",type:"nom", gender:"die", word:"Anskunft", plural:"Auskünfte", example:"Bei der Auskunft kann man Informationen bekommen", },
	{chinese:"图书馆",type:"nom", gender:"die", word:"Bibliothek", plural:"Bibliotheken", example:"Ich arbeite gern in der Bibliothek", },
	{chinese:"行人",type:"nom", gender:"der", word:"Passant", plural:"Passanten", example:"Der erste Passant kann Frau Wang nicht helfen", },
	{chinese:"陌生的",type:"adj", gender:"nan", word:"fremd", plural:"nan", example:"Tur mir leid, ich bin auch fremd hier", },
	{chinese:"对不起",type:"nom", gender:"die", word:"Verzeihung", plural:"o.Pl", example:"Verzeihung, wie komme ich zur Stadtbibliothek?", },
	{chinese:"国家",type:"nom", gender:"der", word:"Staad", plural:"Staadten", example:"Wie viele Staaten gibt es in der Welt?", },
	{chinese:"远的",type:"adj", gender:"nan", word:"weit", plural:"nan", example:"Wie weit ist es denn?", },
	{chinese:"复杂的",type:"adj", gender:"nan", word:"kompliziert", plural:"nan", example:"Das ist aber kompliziert, wie kann ich es Ihnen beschreiben", },
	{chinese:"解释，说明",type:"inf", gender:"nan", word:"erklären", plural:"nan", example:"Der Lehrer kann die deutsche Grammatik sehr gut erklären", },
	{chinese:"线路",type:"nom", gender:"die", word:"Linie", plural:"Linien", example:"Mit welcher Linie fährt man zum Westsee?", },
	{chinese:"方向",type:"nom", gender:"die", word:"Richtung", plural:"Richtungen", example:"Sie müssen zuerst die S6 in Richtung Hauptbahnhof nehmen", },
	{chinese:"上车",type:"trennV", gender:"nan", word:"ein/steigen", plural:"nan", example:"Bitte, alle einsteigen! Der Zug fährt in drei Minuten ab", },
	{chinese:"换乘",type:"trennV", gender:"nan", word:"um/steigen", plural:"nan", example:"Dort steigen Sie in die U2 um und fahren bis zum Karlsplatz", },
	{chinese:"一直，径直",type:"adv", gender:"nan", word:"geraderaus", plural:"nan", example:"Gehen Sie bitte geradeaus etwa 100 Meter weiter, dann nach links", },
	{chinese:"之后",type:"adv", gender:"nan", word:"danach", plural:"nan", example:"Wir lesen zuerst gemeisam den Text, danach machen wir eine Pause", },
	{chinese:"公共汽车停靠站",type:"nom", gender:"die", word:"Haltestelle", plural:"Haltestellen", example:"Auf der linken Seite sehen Sie eine Post. Die Haltestelle ist gleich vor der Post", },
	{chinese:"拐弯",type:"trennV", gender:"nan", word:"ab/biegen", plural:"nan", example:"Dort an der Kreuzung biegen Sie links in die Goethestraße ab", },
	{chinese:"沿着，顺着",type:"präp", gender:"nan", word:"entlang", plural:"nan", example:"Gehen Sie die Straße entlang, dann an der zweiten Kreuzung nach links", },
	{chinese:"横穿，途经",type:"präp", gender:"nan", word:"über", plural:"nan", example:"Wie gehen die Straße entlang, dann über eine Brücke, hinter der Brücke ist der Supermarkt", },
	{chinese:"穿过，通过",type:"präp", gender:"nan", word:"durch", plural:"nan", example:"Er fährt durch die Yanan Straße bis zum Wulinmen Platz", },
	{chinese:"大门",type:"nom", gender:"das", word:"Tor", plural:"Tore", example:"Wo treffen wir uns? Vor dem großen Tor der Universität", },
	{chinese:"经过",type:"adv", gender:"nan", word:"vorbei", plural:"nan", example:"Fahren Sie durch das Stadttor, dann über eine Brücke, danach an einer Schule vorbei", },
	{chinese:"最终，终于",type:"adv", gender:"nan", word:"schließlich", plural:"nan", example:"Auf der linken Seite sehen Sie schließlich eine Post", },
	{chinese:"陪伴，陪同",type:"inf", gender:"nan", word:"begleiten", plural:"nan", example:"Ich kann Sie ein Stück begleiten", },
	{chinese:"赶快",type:"inf", gender:"nan", word:"beeilen", plural:"nan", example:"Oh, es ist schon fünf vor sechs. Ich muss mich beeilen", },
	{chinese:"红绿灯",type:"nom", gender:"die", word:"Ampel", plural:"Ampeln", example:"Die Ampel ist rot, man soll nicht über die Straße gehen", },
	{chinese:"西方",type:"nom", gender:"der", word:"Westen", plural:"o.Pl", example:"Im Westen der Stadt gibt es viele Hochhäuser", },
	{chinese:"东方",type:"nom", gender:"der", word:"Osten", plural:"o.Pl", example:"Wir fahren in Richtung Osten", },
	{chinese:"驾照",type:"nom", gender:"der", word:"Führeischein", plural:"Führeischeine", example:"Erst mit einem Führeischein kann man Auto fahren", },
	{chinese:"看到，察觉",type:"inf", gender:"nan", word:"bemerken", plural:"nan", example:"Erst an der Kasse im Supermarkt habe ich bemerkt, dass ich unterwegs mein Geld verloren habe", },
	{chinese:"女导游",type:"nom", gender:"die", word:"Reiseleiterin", plural:"Reiserleiterinnen", example:"Von Beruf ist sie Reiseleiterin", },
	{chinese:"周游，环行",type:"nom", gender:"die", word:"Rundfahrt", plural:"Rundfahrten", example:"Am Wochenende haben wir eine Rundfahrt durch die Stadt gemacht", },
	{chinese:"叙述，讲述",type:"inf", gender:"nan", word:"erzählen", plural:"nan", example:"Die Mutter erzählt dem Sohn eine Geschichte", },
	{chinese:"庙宇",type:"nom", gender:"der", word:"Tempel", plural:"Tempel", example:"Der Tempel auf dem Berg ist über 150 Jahre alt", },
	{chinese:"省",type:"nom", gender:"die", word:"Provinz", plural:"Provinzen", example:"Hangzhou ist die Hauptstadt der Provinz Zhejiang", },
	{chinese:"风光，风景",type:"nom", gender:"die", word:"Landschaft", plural:"Landschaften", example:"Die Landschaften um den See ist wunderschön", },
	{chinese:"天堂",type:"nom", gender:"das", word:"Paradies", plural:"Paradiese", example:"Mann nennt die Stadt Hangzhou ,, das Paradies auf Erden\"", },
	{chinese:"每年的",type:"adj", gender:"nan", word:"jährlich", plural:"nan", example:"Jährlich kommen Tausende von ausländischen Gästen nach Hanzhou", },
	{chinese:"游客，旅游者",type:"nom", gender:"der", word:"Tourist", plural:"Touristen", example:"Viele chinesische und ausländische Touristen möchten die schöne Stadt besuchen", },
	{chinese:"湖",type:"nom", gender:"der", word:"See", plural:"Seen", example:"Der Westsee ist das Wahrzeichen der Stadt Hangzhou", },
	{chinese:"角色",type:"nom", gender:"die", word:"Rolle", plural:"Rollen", example:"Welche Rolle spielen Sie", },
	{chinese:"岸",type:"nom", gender:"das", word:"Ufer", plural:"Ufer", example:"Jeden Tag sitzen viele Leute in den Tenhäusern am Ufer des Westsee und trinken dort den Longjing-Tee", },
	{chinese:"长凳",type:"nom", gender:"die", word:"Bank", plural:"Bänke", example:"Jeden Tag sitzen Menschen auf den Bänken am Westsee", },
	{chinese:"村庄",type:"nom", gender:"das", word:"Dorf", plural:"Dörfer", example:"In der Umgebung gibt es viele schöne kleine Dörfer", },
	{chinese:"攀登",type:"inf", gender:"nan", word:"steigen", plural:"nan", example:"Sie könne auf den Berg steigen und den alten Tempel besichtigen", },
];