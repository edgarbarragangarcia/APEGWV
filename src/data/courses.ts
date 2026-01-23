export interface GolfCourse {
    id: string;
    name: string;
    club: string;
    city: string;
    zone: 'Bogotá' | 'Centro' | 'Santanderes' | 'Costa' | 'Eje Cafetero' | 'Valle' | 'Antioquia';
    recorridos?: string[];
    description: string;
    lat: number;
    lon: number;
}

export const COLOMBIAN_COURSES: GolfCourse[] = [
    // ZONA BOGOTÁ
    { id: 'lagartos-david', name: 'David Gutiérrez', club: 'Club Los Lagartos', city: 'Bogotá', zone: 'Bogotá', recorridos: ['David Gutiérrez', 'Corea'], description: 'Campo par 72 rediseñado por Nicklaus Design, famoso por sus lagos y terrenos ondulados.', lat: 4.7083, lon: -74.0889 },
    { id: 'country-fundadores', name: 'Fundadores', club: 'Country Club de Bogotá', city: 'Bogotá', zone: 'Bogotá', recorridos: ['Fundadores', 'Pacos y Fabios'], description: 'Sede del Korn Ferry Tour, un campo tradicional y exigente de 7,200 yardas.', lat: 4.7258, lon: -74.0494 },
    { id: 'san-andres', name: 'Campo Principal', club: 'San Andrés Golf Club', city: 'Facatativá', zone: 'Bogotá', description: 'Uno de los campos más antiguos y clásicos del país, par 72.', lat: 4.8167, lon: -74.3500 },
    { id: 'el-rincon', name: 'Campo Principal', club: 'El Rincón de Cajicá', city: 'Cajicá', zone: 'Bogotá', description: 'Considerado uno de los mejores campos de Latinoamérica, diseño de Robert Trent Jones.', lat: 4.9167, lon: -74.0167 },
    { id: 'guaymaral-1', name: 'Campo 1', club: 'Club Guaymaral', city: 'Bogotá', zone: 'Bogotá', recorridos: ['Campo 1', 'Campo 2'], description: 'Dos excelentes recorridos de 18 hoyos par 72.', lat: 4.7833, lon: -74.0500 },
    { id: 'hatogrande', name: 'Campo Principal', club: 'Hatogrande Golf & Tennis', city: 'Sopó', zone: 'Bogotá', description: 'Campo moderno y competitivo al norte de la ciudad.', lat: 4.9167, lon: -73.9500 },
    { id: 'la-pradera', name: 'Campo Principal', club: 'La Pradera de Potosí', city: 'La Calera', zone: 'Bogotá', description: 'Campo de alta montaña con vistas espectaculares.', lat: 4.7500, lon: -73.9667 },
    { id: 'pueblo-viejo', name: 'Campo Principal', club: 'Pueblo Viejo Country Club', city: 'Cota', zone: 'Bogotá', description: 'Terreno plano y vientos cruzados desafiantes.', lat: 4.8167, lon: -74.1167 },
    { id: 'briceno-18', name: 'Campo Principal', club: 'Briceño 18', city: 'Sopó', zone: 'Bogotá', description: 'Campo público de gran calidad, sede de múltiples eventos.', lat: 4.9000, lon: -73.9167 },
    { id: 'club-militar', name: 'Campo Principal', club: 'Club Militar de Golf', city: 'Sopó', zone: 'Bogotá', description: 'Campo par 72 de 18 hoyos ubicado en Sopó, Cundinamarca (Km 27 Autopista Norte). Diseñado con amplias calles y hermosos paisajes, ofrece un desafío técnico para golfistas de todos los niveles.', lat: 4.8833, lon: -74.0167 },

    // ZONA ANTIOQUIA
    { id: 'llanogrande', name: 'Llanogrande', club: 'Club Campestre Medellín', city: 'Rionegro', zone: 'Antioquia', description: 'Campo par 72 en el Eje Cafetero, clima perfecto para el golf.', lat: 6.1333, lon: -75.4333 },
    { id: 'el-rodeo', name: 'La Macarena', club: 'Club Campestre El Rodeo', city: 'Medellín', zone: 'Antioquia', description: 'Ubicado en el valle de Aburrá, ofrece vistas únicas de la ciudad.', lat: 6.1833, lon: -75.5833 },

    // ZONA VALLE
    { id: 'cc-cali', name: 'Campo Principal', club: 'Club Campestre de Cali', city: 'Cali', zone: 'Valle', description: 'Campo largo y exigente con el sello de Jack Nicklaus Co.', lat: 3.3500, lon: -76.5333 },
    { id: 'farallones', name: 'Campo Principal', club: 'Club Campestre Farallones', city: 'Cali', zone: 'Valle', description: 'Cuenta con el único par 6 de Colombia.', lat: 3.3167, lon: -76.5500 },

    // ZONA COSTA
    { id: 'karibana', name: 'Karibana', club: 'TPC Karibana', city: 'Cartagena', zone: 'Costa', description: 'Diseño de Jack Nicklaus a la orilla del Mar Caribe.', lat: 10.5333, lon: -75.4333 },
    { id: 'cc-barranquilla', name: 'Campo Principal', club: 'Country Club de Barranquilla', city: 'Barranquilla', zone: 'Costa', description: 'Tradición y brisa marina constante.', lat: 11.0167, lon: -74.8333 },
    { id: 'caujaral', name: 'Lagos de Caujaral', club: 'Club Lagos de Caujaral', city: 'Puerto Colombia', zone: 'Costa', description: 'Famoso por sus hoyos con vista directa al mar.', lat: 11.0167, lon: -74.8833 },

    // ZONA SANTANDERES
    { id: 'ruitoque', name: 'Ruitoque', club: 'Ruitoque Golf Country', city: 'Bucaramanga', zone: 'Santanderes', description: 'Diseño de Nicklaus en un entorno de montaña espectacular.', lat: 7.0333, lon: -73.1167 },
    { id: 'cc-bucaramanga', name: 'Campo Principal', club: 'Club Campestre Bucaramanga', city: 'Bucaramanga', zone: 'Santanderes', description: 'Campo técnico con mucha vegetación.', lat: 7.0833, lon: -73.1167 },

    // ZONA EJE CAFETERO
    { id: 'cc-pereira', name: 'Campo Principal', club: 'Club Campestre de Pereira', city: 'Pereira', zone: 'Eje Cafetero', description: 'Inmerso en el paisaje cafetero nacional.', lat: 4.8167, lon: -75.7833 },
    { id: 'cc-armenia', name: 'Campo Principal', club: 'Club Campestre de Armenia', city: 'Armenia', zone: 'Eje Cafetero', description: 'Rodeado de guaduales y árboles frutales.', lat: 4.4667, lon: -75.7667 },

    // ZONA CENTRO
    { id: 'peñon', name: 'Campo Principal', club: 'Club El Peñón', city: 'Girardot', zone: 'Centro', description: 'Campo de clima cálido rodeado de agua en casi todos sus hoyos.', lat: 4.3000, lon: -74.8167 },
    { id: 'mesa-yeguas', name: 'Campo Principal', club: 'Mesa de Yeguas', city: 'Anapoima', zone: 'Centro', description: 'Exclusividad y diseño desafiante en el valle del río Bogotá.', lat: 4.4500, lon: -74.5333 },
];
