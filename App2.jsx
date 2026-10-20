import React, { useState, useEffect, useRef } from 'react';
import logoFalcon from './assets/logo.jpg';
const URL_LOGO =logoFalcon;
import { supabase } from './supabaseClient';
// --- BASE DE DATOS INICIAL DE PRODUCTOS ---

const PRODUCTOS_INICIALES_DB = [
  // 🥤 Bebidas
  { id: "beb-01", nombre: "90 MINUTOS AZUL", categoria: "Bebidas", precio: 0.77, unidad: "Unidad" },
  { id: "beb-02", nombre: "90 MINUTOS BLANCO", categoria: "Bebidas", precio: 0.47, unidad: "Unidad" },
  { id: "beb-03", nombre: "AGUA GASIFICADA", categoria: "Bebidas", precio: 0.85, unidad: "Unidad" },
  { id: "beb-04", nombre: "AGUA MINALBA 355", categoria: "Bebidas", precio: 0.54, unidad: "Unidad" },
  { id: "beb-05", nombre: "AGUA MINALBA 600", categoria: "Bebidas", precio: 0.69, unidad: "Unidad" },
  { id: "beb-06", nombre: "AGUA MINALBA DE 1.5 LITROS", categoria: "Bebidas", precio: 1.28, unidad: "Unidad" },
  { id: "beb-07", nombre: "AGUA NEVADA 600", categoria: "Bebidas", precio: 0.69, unidad: "Unidad" },
  { id: "beb-08", nombre: "AGUAKINA", categoria: "Bebidas", precio: 0.84, unidad: "Unidad" },
  { id: "beb-09", nombre: "ENERGIZANTE SPARTANO", categoria: "Bebidas", precio: 3.37, unidad: "Unidad" },
  { id: "beb-10", nombre: "GATORADE", categoria: "Bebidas", precio: 1.40, unidad: "Unidad" },
  { id: "beb-11", nombre: "JUGO DE 1 LITRO NATULAC", categoria: "Bebidas", precio: 1.46, unidad: "Unidad" },
  { id: "beb-12", nombre: "JUGO NATULAC 355", categoria: "Bebidas", precio: 0.60, unidad: "Unidad" },
  { id: "beb-13", nombre: "JUGO YUIKERI 500 ML MD", categoria: "Bebidas", precio: 1.15, unidad: "Unidad" },
  { id: "beb-14", nombre: "JUGO YUIKERI 1,5 LTRO", categoria: "Bebidas", precio: 2.86, unidad: "Unidad" },
  { id: "beb-15", nombre: "JUGO YUIKERI BOTELLITA", categoria: "Bebidas", precio: 0.71, unidad: "Unidad" },
  { id: "beb-16", nombre: "JUGO YUKY PACK", categoria: "Bebidas", precio: 0.71, unidad: "Unidad" },
  { id: "beb-17", nombre: "JUGOS NATURALES", categoria: "Bebidas", precio: 1.42, unidad: "Unidad" },
  { id: "beb-18", nombre: "LIPTON DE 1,5 LITROS", categoria: "Bebidas", precio: 3.15, unidad: "Unidad" },
  { id: "beb-19", nombre: "LIPTON DE 500 ML", categoria: "Bebidas", precio: 1.29, unidad: "Unidad" },
  { id: "beb-20", nombre: "MALTA DE 1.5 LITROS", categoria: "Bebidas", precio: 1.41, unidad: "Unidad" },
  { id: "beb-21", nombre: "MALTA DE BOTELLA 255", categoria: "Bebidas", precio: 0.56, unidad: "Unidad" },
  { id: "beb-22", nombre: "MALTA DE LATA 355", categoria: "Bebidas", precio: 0.70, unidad: "Unidad" },
  { id: "beb-23", nombre: "MALTA LATA 255", categoria: "Bebidas", precio: 0.54, unidad: "Unidad" },
  { id: "beb-24", nombre: "MAXICOCO", categoria: "Bebidas", precio: 0.33, unidad: "Unidad" },
  { id: "beb-25", nombre: "MONSTHER", categoria: "Bebidas", precio: 2.12, unidad: "Unidad" },
  { id: "beb-26", nombre: "REFRESCO 1 LITRO PEPSI", categoria: "Bebidas", precio: 1.03, unidad: "Unidad" },
  { id: "beb-27", nombre: "REFRESCO 1 LITRO COCA", categoria: "Bebidas", precio: 0.75, unidad: "Unidad" },
  { id: "beb-28", nombre: "REFRESCO 1.5 LITROS pepsi", categoria: "Bebidas", precio: 1.43, unidad: "Unidad" },
  { id: "beb-29", nombre: "REFRESCO 1.5 LITROS COCA", categoria: "Bebidas", precio: 1.08, unidad: "Unidad" },
  { id: "beb-30", nombre: "REFRESCO 2 LT COCACOLA", categoria: "Bebidas", precio: 1.33, unidad: "Unidad" },
  { id: "beb-31", nombre: "REFRESCO BOMBONITA", categoria: "Bebidas", precio: 0.51, unidad: "Unidad" },
  { id: "beb-32", nombre: "REFRESCO DE LATA COCA", categoria: "Bebidas", precio: 0.88, unidad: "Unidad" },
  { id: "beb-33", nombre: "REFRESCO DE LATA PEPSI", categoria: "Bebidas", precio: 0.73, unidad: "Unidad" },
  { id: "beb-34", nombre: "REFRESCO PEPSI BOTELLA", categoria: "Bebidas", precio: 0.75, unidad: "Unidad" },
  { id: "beb-35", nombre: "SODA COCACOLA SCHWEPPES BOMBO", categoria: "Bebidas", precio: 0.77, unidad: "Unidad" },
  { id: "beb-36", nombre: "SODA COCACOLA SCHWEPPES LATA", categoria: "Bebidas", precio: 0.99, unidad: "Unidad" },
  { id: "beb-37", nombre: "SODA EVEREES LATA", categoria: "Bebidas", precio: 0.84, unidad: "Unidad" },
  { id: "beb-38", nombre: "SODA LATA SPARKIN PEPSI", categoria: "Bebidas", precio: 0.84, unidad: "Unidad" },
  { id: "beb-39", nombre: "SPEED MAX", categoria: "Bebidas", precio: 0.65, unidad: "Unidad" },

  // 🍫 Golosinas y Chocolates
  { id: "gol-01", nombre: "CAMELO TAMARINDO", categoria: "Golosinas y Chocolates", precio: 0.03, unidad: "Unidad" },
  { id: "gol-02", nombre: "CARAMELO CAFÉ", categoria: "Golosinas y Chocolates", precio: 0.04, unidad: "Unidad" },
  { id: "gol-03", nombre: "CARAMELOS CHAO", categoria: "Golosinas y Chocolates", precio: 0.03, unidad: "Unidad" },
  { id: "gol-04", nombre: "CARAMELOS FREEGELLS", categoria: "Golosinas y Chocolates", precio: 0.03, unidad: "Unidad" },
  { id: "gol-05", nombre: "CARAMELOS FRUTAS COLOMBINA", categoria: "Golosinas y Chocolates", precio: 0.02, unidad: "Unidad" },
  { id: "gol-06", nombre: "CARAMELOS HALLS MENTOLITO", categoria: "Golosinas y Chocolates", precio: 0.67, unidad: "Unidad" },
  { id: "gol-07", nombre: "CARAMELOS MENTA HELADA", categoria: "Golosinas y Chocolates", precio: 0.03, unidad: "Unidad" },
  { id: "gol-08", nombre: "CARAMELOS PIETROBOM", categoria: "Golosinas y Chocolates", precio: 1.00, unidad: "Unidad" },
  { id: "gol-09", nombre: "CHAO FRUST", categoria: "Golosinas y Chocolates", precio: 0.25, unidad: "Unidad" },
  { id: "gol-10", nombre: "CHICHE AGOGO", categoria: "Golosinas y Chocolates", precio: 0.12, unidad: "Unidad" },
  { id: "gol-11", nombre: "CHIMU AMARILLO", categoria: "Golosinas y Chocolates", precio: 0.33, unidad: "Unidad" },
  { id: "gol-12", nombre: "CHIMU ROJO", categoria: "Golosinas y Chocolates", precio: 0.23, unidad: "Unidad" },
  { id: "gol-13", nombre: "CHISTRIS GD", categoria: "Golosinas y Chocolates", precio: 1.42, unidad: "Unidad" },
  { id: "gol-14", nombre: "CHISTRIS PQ", categoria: "Golosinas y Chocolates", precio: 0.65, unidad: "Unidad" },
  { id: "gol-15", nombre: "CHOCOLATE BIANCHI MINI", categoria: "Golosinas y Chocolates", precio: 0.38, unidad: "Unidad" },
  { id: "gol-16", nombre: "CHOCOLATE BON O BON 225GMS", categoria: "Golosinas y Chocolates", precio: 0.25, unidad: "Unidad" },
  { id: "gol-17", nombre: "CHOCOLATE BON OBON 450", categoria: "Golosinas y Chocolates", precio: 0.22, unidad: "Unidad" },
  { id: "gol-18", nombre: "CHOCOLATE CARRE 25G", categoria: "Golosinas y Chocolates", precio: 0.81, unidad: "Unidad" },
  { id: "gol-19", nombre: "CHOCOLATE CRYCRY 130", categoria: "Golosinas y Chocolates", precio: 2.58, unidad: "Unidad" },
  { id: "gol-20", nombre: "CHOCOLATE CRYCRY 27 PQ", categoria: "Golosinas y Chocolates", precio: 0.83, unidad: "Unidad" },
  { id: "gol-21", nombre: "CHOCOLATE GALAK 130 GMS", categoria: "Golosinas y Chocolates", precio: 2.58, unidad: "Unidad" },
  { id: "gol-22", nombre: "CHOCOLATE GALAK 30 GMS", categoria: "Golosinas y Chocolates", precio: 0.83, unidad: "Unidad" },
  { id: "gol-23", nombre: "CHOCOLATE PENINSULA", categoria: "Golosinas y Chocolates", precio: 26.15, unidad: "Unidad" },
  { id: "gol-24", nombre: "CHOCOLATE RIKITI 30 G", categoria: "Golosinas y Chocolates", precio: 0.83, unidad: "Unidad" },
  { id: "gol-25", nombre: "CHOCOLATE SAVOY CHOCO LECHE 30", categoria: "Golosinas y Chocolates", precio: 0.83, unidad: "Unidad" },
  { id: "gol-26", nombre: "CHOCOLATE SAVOY CHOCODUO 130", categoria: "Golosinas y Chocolates", precio: 2.58, unidad: "Unidad" },
  { id: "gol-27", nombre: "CHOCOLATE SAVOY LIGHT 130 GMS", categoria: "Golosinas y Chocolates", precio: 1.80, unidad: "Unidad" },
  { id: "gol-28", nombre: "CHOOOATE CARRE 100G", categoria: "Golosinas y Chocolates", precio: 2.72, unidad: "Unidad" },
  { id: "gol-29", nombre: "CHOLATE BON OBOM SOBRE 75GM", categoria: "Golosinas y Chocolates", precio: 1.44, unidad: "Unidad" },
  { id: "gol-30", nombre: "CHOLATE SAVOY LIGHT 30 GMS", categoria: "Golosinas y Chocolates", precio: 1.15, unidad: "Unidad" },
  { id: "gol-31", nombre: "CHUPETAS BOMBOMBUN", categoria: "Golosinas y Chocolates", precio: 0.08, unidad: "Unidad" },
  { id: "gol-32", nombre: "CRUNCHILATE", categoria: "Golosinas y Chocolates", precio: 0.26, unidad: "Unidad" },
  { id: "gol-33", nombre: "GALAK TUBO 16 GRS", categoria: "Golosinas y Chocolates", precio: 0.21, unidad: "Unidad" },
  { id: "gol-34", nombre: "GOLPE PG", categoria: "Golosinas y Chocolates", precio: 0.63, unidad: "Unidad" },
  { id: "gol-35", nombre: "GOMITA ATLANTI", categoria: "Golosinas y Chocolates", precio: 0.10, unidad: "Unidad" },
  { id: "gol-36", nombre: "GOMITAS PLAY", categoria: "Golosinas y Chocolates", precio: 0.39, unidad: "Unidad" },
  { id: "gol-37", nombre: "MARSHMALLOWS GD", categoria: "Golosinas y Chocolates", precio: 2.20, unidad: "Unidad" },
  { id: "gol-38", nombre: "MARSHMALLOWS PQ", categoria: "Golosinas y Chocolates", precio: 1.00, unidad: "Unidad" },
  { id: "gol-39", nombre: "MECHAS LOCAS", categoria: "Golosinas y Chocolates", precio: 0.88, unidad: "Unidad" },
  { id: "gol-40", nombre: "MINI FLAQUITO", categoria: "Golosinas y Chocolates", precio: 0.13, unidad: "Unidad" },
  { id: "gol-41", nombre: "NUTELIN", categoria: "Golosinas y Chocolates", precio: 0.17, unidad: "Unidad" },
  { id: "gol-42", nombre: "OVOMALTINA", categoria: "Golosinas y Chocolates", precio: 1.23, unidad: "Unidad" },
  { id: "gol-43", nombre: "PALITOS DE CHOCOLATE", categoria: "Golosinas y Chocolates", precio: 0.39, unidad: "Unidad" },
  { id: "gol-44", nombre: "PALOMITAS 68 GR", categoria: "Golosinas y Chocolates", precio: 0.55, unidad: "Unidad" },
  { id: "gol-45", nombre: "PEPITO GD", categoria: "Golosinas y Chocolates", precio: 0.87, unidad: "Unidad" },
  { id: "gol-46", nombre: "PEPITO PQ", categoria: "Golosinas y Chocolates", precio: 0.54, unidad: "Unidad" },
  { id: "gol-47", nombre: "PIRULIN 16 MG", categoria: "Golosinas y Chocolates", precio: 0.38, unidad: "Unidad" },
  { id: "gol-48", nombre: "PIRULIN LUGO", categoria: "Golosinas y Chocolates", precio: 1.88, unidad: "Unidad" },
  { id: "gol-49", nombre: "PIRULIN POTE", categoria: "Golosinas y Chocolates", precio: 6.90, unidad: "Unidad" },
  { id: "gol-50", nombre: "PUSH POP", categoria: "Golosinas y Chocolates", precio: 0.67, unidad: "Unidad" },
  { id: "gol-51", nombre: "RAQUETI 18GR", categoria: "Golosinas y Chocolates", precio: 0.34, unidad: "Unidad" },
  { id: "gol-52", nombre: "RAQUETI 36 GR", categoria: "Golosinas y Chocolates", precio: 0.59, unidad: "Unidad" },
  { id: "gol-53", nombre: "RING POP", categoria: "Golosinas y Chocolates", precio: 0.21, unidad: "Unidad" },
  { id: "gol-54", nombre: "SAMBA", categoria: "Golosinas y Chocolates", precio: 0.55, unidad: "Unidad" },
  { id: "gol-55", nombre: "SPLOT ACID XS", categoria: "Golosinas y Chocolates", precio: 0.13, unidad: "Unidad" },
  { id: "gol-56", nombre: "SPLOT OJO", categoria: "Golosinas y Chocolates", precio: 0.03, unidad: "Unidad" },
  { id: "gol-57", nombre: "SUSY", categoria: "Golosinas y Chocolates", precio: 6.69, unidad: "Unidad" },
  { id: "gol-58", nombre: "TRIDENT 30,6 GMS", categoria: "Golosinas y Chocolates", precio: 1.76, unidad: "Unidad" },
  { id: "gol-59", nombre: "TRIDENT 8,5 GMS", categoria: "Golosinas y Chocolates", precio: 0.48, unidad: "Unidad" },
  { id: "gol-60", nombre: "TRULULU CHOCOLATE", categoria: "Golosinas y Chocolates", precio: 0.44, unidad: "Unidad" },

  // 🍪 Galletas y Snacks
  { id: "snk-01", nombre: "CHEETOS 110", categoria: "Galletas y Snacks", precio: 1.31, unidad: "Unidad" },
  { id: "snk-02", nombre: "DANDY", categoria: "Galletas y Snacks", precio: 0.38, unidad: "Unidad" },
  { id: "snk-03", nombre: "DE TODITO GRANDE", categoria: "Galletas y Snacks", precio: 1.32, unidad: "Unidad" },
  { id: "snk-04", nombre: "DE TODITO PQ", categoria: "Galletas y Snacks", precio: 0.63, unidad: "Unidad" },
  { id: "snk-05", nombre: "DORITO GD", categoria: "Galletas y Snacks", precio: 2.00, unidad: "Unidad" },
  { id: "snk-06", nombre: "DORITO PICANTE GRANDE", categoria: "Galletas y Snacks", precio: 2.00, unidad: "Unidad" },
  { id: "snk-07", nombre: "DORITO PQ", categoria: "Galletas y Snacks", precio: 0.71, unidad: "Unidad" },
  { id: "snk-08", nombre: "FRUTOS SECOS AZUCAR CANELA 80GR", categoria: "Galletas y Snacks", precio: 0.88, unidad: "Unidad" },
  { id: "snk-09", nombre: "GALLETA CHIPS AHOY", categoria: "Galletas y Snacks", precio: 1.75, unidad: "Unidad" },
  { id: "snk-10", nombre: "GALLETA CLUB SOCIAL", categoria: "Galletas y Snacks", precio: 0.20, unidad: "Unidad" },
  { id: "snk-11", nombre: "GALLETA DE SODA", categoria: "Galletas y Snacks", precio: 0.11, unidad: "Unidad" },
  { id: "snk-12", nombre: "GALLETA hony/kraker", categoria: "Galletas y Snacks", precio: 0.22, unidad: "Unidad" },
  { id: "snk-13", nombre: "GALLETA OREO", categoria: "Galletas y Snacks", precio: 0.29, unidad: "Unidad" },
  { id: "snk-14", nombre: "GALLETA OREO FUDGE", categoria: "Galletas y Snacks", precio: 0.36, unidad: "Unidad" },
  { id: "snk-15", nombre: "GALLETA OREO TUBO", categoria: "Galletas y Snacks", precio: 0.93, unidad: "Unidad" },
  { id: "snk-16", nombre: "PLAT. NATUCHIP PQ", categoria: "Galletas y Snacks", precio: 0.73, unidad: "Unidad" },
  { id: "snk-17", nombre: "RUFLE GD", categoria: "Galletas y Snacks", precio: 2.63, unidad: "Unidad" },
  { id: "snk-18", nombre: "RUFLE PQ", categoria: "Galletas y Snacks", precio: 0.83, unidad: "Unidad" },
  { id: "snk-19", nombre: "TAKI", categoria: "Galletas y Snacks", precio: 1.50, unidad: "Unidad" },
  { id: "snk-20", nombre: "TOSTONES DEL CAMPO FAM.", categoria: "Galletas y Snacks", precio: 1.90, unidad: "Unidad" },
  { id: "snk-21", nombre: "TOSTONES DEL CAMPO MD", categoria: "Galletas y Snacks", precio: 1.20, unidad: "Unidad" },
  { id: "snk-22", nombre: "TOSTONES DEL CAMPO PQ", categoria: "Galletas y Snacks", precio: 0.40, unidad: "Unidad" },

  // ☕ Lácteos y Cafés
  { id: "lac-01", nombre: "AZÚCAR EN SOBRE LA PASTORA", categoria: "Lácteos y Cafés", precio: 0.01, unidad: "Unidad" },
  { id: "lac-02", nombre: "AZÚCAR EN SOBRE MONTALBAN", categoria: "Lácteos y Cafés", precio: 2.46, unidad: "Unidad" },
  { id: "lac-03", nombre: "AZÚCAR EN SOBRE PANANI", categoria: "Lácteos y Cafés", precio: 3.00, unidad: "Unidad" },
  { id: "lac-04", nombre: "AZÚCAR SPLENDA", categoria: "Lácteos y Cafés", precio: 0.07, unidad: "Unidad" },
  { id: "lac-05", nombre: "CAFÉ EN GRANOS AMANECER", categoria: "Lácteos y Cafés", precio: 13.28, unidad: "Kg" },
  { id: "lac-06", nombre: "CAFÉ EN GRANOS SALVADOR", categoria: "Lácteos y Cafés", precio: 8.47, unidad: "Kg" },
  { id: "lac-07", nombre: "CHANTILLI", categoria: "Lácteos y Cafés", precio: 3.67, unidad: "Unidad" },
  { id: "lac-08", nombre: "COCOSETE DE CAJA 1X18", categoria: "Lácteos y Cafés", precio: 0.69, unidad: "Unidad" },
  { id: "lac-09", nombre: "GELATINA FRUTA", categoria: "Lácteos y Cafés", precio: 0.11, unidad: "Unidad" },
  { id: "lac-10", nombre: "LECHE CARABOBO", categoria: "Lácteos y Cafés", precio: 1.71, unidad: "Unidad" },
  { id: "lac-11", nombre: "LECHE NATULAC", categoria: "Lácteos y Cafés", precio: 1.59, unidad: "Unidad" },
  { id: "lac-12", nombre: "LECHE PURISIMA", categoria: "Lácteos y Cafés", precio: 1.67, unidad: "Unidad" },
  { id: "lac-13", nombre: "NESTLE CAPUCHINO VAINILLA", categoria: "Lácteos y Cafés", precio: 31.00, unidad: "Unidad" },
  { id: "lac-14", nombre: "PAPA TIGO GQ", categoria: "Lácteos y Cafés", precio: 1.54, unidad: "Unidad" },
  { id: "lac-15", nombre: "PAPA TIGO PQ", categoria: "Lácteos y Cafés", precio: 0.72, unidad: "Unidad" },
  { id: "lac-16", nombre: "PENINSULA CAFÉ EN GRANO", categoria: "Lácteos y Cafés", precio: 16.66, unidad: "Kg" },
  { id: "lac-17", nombre: "PENINSULA LECHE", categoria: "Lácteos y Cafés", precio: 26.15, unidad: "Unidad" },
  { id: "lac-18", nombre: "QUESILLO CREMOCILLO", categoria: "Lácteos y Cafés", precio: 1.62, unidad: "Unidad" },
  { id: "lac-19", nombre: "SIROPE DE CARAMELO", categoria: "Lácteos y Cafés", precio: 7.00, unidad: "Unidad" },
  { id: "lac-20", nombre: "SIROPE DE CHOCOLATE 1,36 KL", categoria: "Lácteos y Cafés", precio: 11.50, unidad: "Unidad" },
  { id: "lac-21", nombre: "SIROPE DE CHOCOLATE 680 gms", categoria: "Lácteos y Cafés", precio: 6.00, unidad: "Unidad" },
  { id: "lac-22", nombre: "TE LIPTON SOBRE", categoria: "Lácteos y Cafés", precio: 2.75, unidad: "Unidad" },
  { id: "lac-23", nombre: "TE NEGRO MCCORMICK", categoria: "Lácteos y Cafés", precio: 2.17, unidad: "Unidad" },
  { id: "lac-24", nombre: "VAINILLA PENINSULA", categoria: "Lácteos y Cafés", precio: 26.15, unidad: "Unidad" },
  { id: "lac-25", nombre: "YOGURT YOLO", categoria: "Lácteos y Cafés", precio: 2.25, unidad: "Unidad" },
  { id: "lac-26", nombre: "YOGURT CREMIGURT", categoria: "Lácteos y Cafés", precio: 1.40, unidad: "Unidad" },

  // 🛍️ Empaques y Descartables
  { id: "emp-01", nombre: "BANDEJA DE ANIME", categoria: "Empaques y Descartables", precio: 0.05, unidad: "Unidad" },
  { id: "emp-02", nombre: "BANDEJA HW1", categoria: "Empaques y Descartables", precio: 0.07, unidad: "Unidad" },
  { id: "emp-03", nombre: "BANDEJAS DELI500", categoria: "Empaques y Descartables", precio: 0.17, unidad: "Unidad" },
  { id: "emp-04", nombre: "BANDEJAS HC23", categoria: "Empaques y Descartables", precio: 0.17, unidad: "Unidad" },
  { id: "emp-05", nombre: "BOLSA 1", categoria: "Empaques y Descartables", precio: 0.25, unidad: "Unidad" },
  { id: "emp-06", nombre: "BOLSA 15KG", categoria: "Empaques y Descartables", precio: 1.33, unidad: "Unidad" },
  { id: "emp-07", nombre: "BOLSA 2 KG", categoria: "Empaques y Descartables", precio: 0.66, unidad: "Unidad" },
  { id: "emp-08", nombre: "BOLSA 3 KG", categoria: "Empaques y Descartables", precio: 0.51, unidad: "Unidad" },
  { id: "emp-09", nombre: "BOLSA 5KG", categoria: "Empaques y Descartables", precio: 0.89, unidad: "Unidad" },
  { id: "emp-10", nombre: "BOLSA CANILLA", categoria: "Empaques y Descartables", precio: 2.40, unidad: "Unidad" },
  { id: "emp-11", nombre: "BOLSA DE PAPEL GRD", categoria: "Empaques y Descartables", precio: 0.04, unidad: "Unidad" },
  { id: "emp-12", nombre: "BOLSA DE PAPEL MD", categoria: "Empaques y Descartables", precio: 0.03, unidad: "Unidad" },
  { id: "emp-13", nombre: "BOLSAS NEGRAS", categoria: "Empaques y Descartables", precio: 0.26, unidad: "Unidad" },
  { id: "emp-14", nombre: "BOLSAS PAPEL PQ", categoria: "Empaques y Descartables", precio: 0.03, unidad: "Unidad" },
  { id: "emp-15", nombre: "CUCHARA BLANCAS feas X1000", categoria: "Empaques y Descartables", precio: 7.63, unidad: "Unidad" },
  { id: "emp-16", nombre: "CUCHARA PEQUEÑA NEGRAS X1000", categoria: "Empaques y Descartables", precio: 8.09, unidad: "Unidad" },
  { id: "emp-17", nombre: "CUCHARAS BLANCAS PAQ", categoria: "Empaques y Descartables", precio: 1.47, unidad: "Unidad" },
  { id: "emp-18", nombre: "GUANTE", categoria: "Empaques y Descartables", precio: 0.00, unidad: "Unidad" },
  { id: "emp-19", nombre: "PAPEL DE ENVOLVER", categoria: "Empaques y Descartables", precio: 12.40, unidad: "Unidad" },
  { id: "emp-20", nombre: "PAPEL ENVOLVER PARAFINADO", categoria: "Empaques y Descartables", precio: 16.00, unidad: "Unidad" },
  { id: "emp-21", nombre: "PAPEL ENVOLVER PARAFINADO BOBIN", categoria: "Empaques y Descartables", precio: 25.87, unidad: "Unidad" },
  { id: "emp-22", nombre: "PITILLO ENBUELTO ZUPLA", categoria: "Empaques y Descartables", precio: 2.76, unidad: "Unidad" },
  { id: "emp-23", nombre: "PITILLOS ENBUELTO SELVA", categoria: "Empaques y Descartables", precio: 3.75, unidad: "Unidad" },
  { id: "emp-24", nombre: "PITILLOS FRAPE", categoria: "Empaques y Descartables", precio: 2.00, unidad: "Unidad" },
  { id: "emp-25", nombre: "REMOVEDORES SELVA", categoria: "Empaques y Descartables", precio: 3.22, unidad: "Unidad" },
  { id: "emp-26", nombre: "REMOVEDORES NEGROS", categoria: "Empaques y Descartables", precio: 3.25, unidad: "Unidad" },
  { id: "emp-27", nombre: "ROLLOS DE MAQ.", categoria: "Empaques y Descartables", precio: 0.50, unidad: "Unidad" },
  { id: "emp-28", nombre: "SERVILLETA CARICIAS GD 1X12", categoria: "Empaques y Descartables", precio: 1.25, unidad: "Unidad" },
  { id: "emp-29", nombre: "SERVILLETA CARICIAS PQ", categoria: "Empaques y Descartables", precio: 0.86, unidad: "Unidad" },
  { id: "emp-30", nombre: "SERVILLETA Z GRAND", categoria: "Empaques y Descartables", precio: 1.20, unidad: "Unidad" },
  { id: "emp-31", nombre: "SERVILLETA Z PQ", categoria: "Empaques y Descartables", precio: 0.64, unidad: "Unidad" },
  { id: "emp-32", nombre: "SERVILLETA ZZZ PQ", categoria: "Empaques y Descartables", precio: 0.96, unidad: "Unidad" },
  { id: "emp-33", nombre: "VASOS DE CAFÉ MATEWS 6onz", categoria: "Empaques y Descartables", precio: 5.42, unidad: "Unidad" },
  { id: "emp-34", nombre: "VASOS DE CAFÉ MATEWS 8onz", categoria: "Empaques y Descartables", precio: 2.90, unidad: "Unidad" },
  { id: "emp-35", nombre: "VASOS DOMO", categoria: "Empaques y Descartables", precio: 0.15, unidad: "Unidad" },
  { id: "emp-36", nombre: "VASOS MAXIPLAS", categoria: "Empaques y Descartables", precio: 1.62, unidad: "Unidad" },
  { id: "emp-37", nombre: "VASOS SARA 8ONZ", categoria: "Empaques y Descartables", precio: 6.08, unidad: "Unidad" },

  // 🍰 Pastelería
  { id: "pas-01", nombre: "BOMBA", categoria: "Pastelería", precio: 1.00, unidad: "Unidad" },
  { id: "pas-02", nombre: "BROWNIE", categoria: "Pastelería", precio: 0.66, unidad: "Unidad" },
  { id: "pas-03", nombre: "CANOLI", categoria: "Pastelería", precio: 1.35, unidad: "Unidad" },
  { id: "pas-04", nombre: "CRUASANT D", categoria: "Pastelería", precio: 2.20, unidad: "Unidad" },
  { id: "pas-05", nombre: "DONA", categoria: "Pastelería", precio: 1.00, unidad: "Unidad" },
  { id: "pas-06", nombre: "JUMBO", categoria: "Pastelería", precio: 1.50, unidad: "Unidad" },
  { id: "pas-07", nombre: "MALETA", categoria: "Pastelería", precio: 1.32, unidad: "Unidad" },
  { id: "pas-08", nombre: "PAN DE LECHE", categoria: "Pastelería", precio: 0.88, unidad: "Unidad" },
  { id: "pas-09", nombre: "PONQUESITO", categoria: "Pastelería", precio: 1.07, unidad: "Unidad" },
  { id: "pas-10", nombre: "PROFITEROL", categoria: "Pastelería", precio: 0.66, unidad: "Unidad" },
  { id: "pas-11", nombre: "MINI MIL HOJA", categoria: "Pastelería", precio: 1.00, unidad: "Unidad" },
  { id: "pas-12", nombre: "MINI CANOLI", categoria: "Pastelería", precio: 0.65, unidad: "Unidad" },
  { id: "pas-13", nombre: "JUMBITOS", categoria: "Pastelería", precio: 0.75, unidad: "Unidad" },
  { id: "pas-14", nombre: "ECLAIRS", categoria: "Pastelería", precio: 0.65, unidad: "Unidad" },
  { id: "pas-15", nombre: "BRAZO", categoria: "Pastelería", precio: 1.60, unidad: "Unidad" },
  { id: "pas-16", nombre: "CHEESECAKE", categoria: "Pastelería", precio: 3.19, unidad: "Unidad" },
  { id: "pas-17", nombre: "MARMOLEADO", categoria: "Pastelería", precio: 1.32, unidad: "Unidad" },
  { id: "pas-18", nombre: "TARTALETA", categoria: "Pastelería", precio: 1.65, unidad: "Unidad" },
  { id: "pas-19", nombre: "TORTA CHOCOLATE", categoria: "Pastelería", precio: 2.70, unidad: "Unidad" },
  { id: "pas-20", nombre: "TORTA LIMON", categoria: "Pastelería", precio: 1.70, unidad: "Unidad" },
  { id: "pas-21", nombre: "TORTA NARANJA", categoria: "Pastelería", precio: 1.60, unidad: "Unidad" },
  { id: "pas-22", nombre: "TORTAS 3LECHE", categoria: "Pastelería", precio: 2.80, unidad: "Unidad" },
  { id: "pas-23", nombre: "TORTA DE PIÑA", categoria: "Pastelería", precio: 1.78, unidad: "Unidad" },
  { id: "pas-24", nombre: "TORTAS AREQUIPE", categoria: "Pastelería", precio: 2.30, unidad: "Unidad" },
  { id: "pas-25", nombre: "QUESILLO", categoria: "Pastelería", precio: 2.05, unidad: "Unidad" },
  { id: "pas-26", nombre: "ROLL DE CANELA", categoria: "Pastelería", precio: 1.24, unidad: "Unidad" },
  { id: "pas-27", nombre: "TIRAMISU", categoria: "Pastelería", precio: 1.54, unidad: "Unidad" },
  { id: "pas-28", nombre: "SELVA NEGRA", categoria: "Pastelería", precio: 2.10, unidad: "Unidad" },
  { id: "pas-29", nombre: "TORTA OREO", categoria: "Pastelería", precio: 2.30, unidad: "Unidad" },
  { id: "pas-30", nombre: "TARTA DE MANZANA", categoria: "Pastelería", precio: 2.10, unidad: "Unidad" },
  { id: "pas-31", nombre: "TORTA DE ZANAHORIA", categoria: "Pastelería", precio: 1.86, unidad: "Unidad" },
  { id: "pas-32", nombre: "PONQUESITO ZANAHO", categoria: "Pastelería", precio: 0.48, unidad: "Unidad" },
  { id: "pas-33", nombre: "PONQUESITO DE AREQUIPE", categoria: "Pastelería", precio: 1.07, unidad: "Unidad" },
  { id: "pas-34", nombre: "MOUSSE DE CHOCO", categoria: "Pastelería", precio: 1.80, unidad: "Unidad" },
  { id: "pas-35", nombre: "SNAKER", categoria: "Pastelería", precio: 2.30, unidad: "Unidad" },
  { id: "pas-36", nombre: "RED VELVET", categoria: "Pastelería", precio: 2.00, unidad: "Unidad" },
  { id: "pas-37", nombre: "TARTALETA DE FRUTAS", categoria: "Pastelería", precio: 0.47, unidad: "Unidad" },
  { id: "pas-38", nombre: "NEWTON", categoria: "Pastelería", precio: 9.90, unidad: "Unidad" },
  { id: "pas-39", nombre: "PASTA SECA", categoria: "Pastelería", precio: 8.80, unidad: "Unidad" },
  { id: "pas-40", nombre: "POLVOROSA", categoria: "Pastelería", precio: 8.80, unidad: "Unidad" },
  { id: "pas-41", nombre: "PALMERITA", categoria: "Pastelería", precio: 9.90, unidad: "Unidad" },
  { id: "pas-42", nombre: "COCADA", categoria: "Pastelería", precio: 9.90, unidad: "Unidad" },
  { id: "pas-43", nombre: "ALFAJOR", categoria: "Pastelería", precio: 0.56, unidad: "Unidad" },
  { id: "pas-44", nombre: "REINITAS", categoria: "Pastelería", precio: 9.90, unidad: "Unidad" },

  // 🥖 Panadería
  { id: "pan-01", nombre: "CANILLA PAQ", categoria: "Panadería", precio: 1.20, unidad: "Unidad" },
  { id: "pan-02", nombre: "CANILLA IND", categoria: "Panadería", precio: 0.33, unidad: "Unidad" },
  { id: "pan-03", nombre: "ANDINO", categoria: "Panadería", precio: 1.65, unidad: "Unidad" },
  { id: "pan-04", nombre: "OREJA", categoria: "Panadería", precio: 1.43, unidad: "Unidad" },
  { id: "pan-05", nombre: "GALLETA HUEVO", categoria: "Panadería", precio: 1.43, unidad: "Unidad" },
  { id: "pan-06", nombre: "PUNTO ROJO", categoria: "Panadería", precio: 1.43, unidad: "Unidad" },
  { id: "pan-07", nombre: "PIÑITA", categoria: "Panadería", precio: 1.38, unidad: "Unidad" },
  { id: "pan-08", nombre: "PASTEL", categoria: "Panadería", precio: 0.70, unidad: "Unidad" },
  { id: "pan-09", nombre: "TEQUEYOYO", categoria: "Panadería", precio: 1.10, unidad: "Unidad" },
  { id: "pan-10", nombre: "TEQUEÑO", categoria: "Panadería", precio: 0.83, unidad: "Unidad" },
  { id: "pan-11", nombre: "CACHITO ESP.", categoria: "Panadería", precio: 1.21, unidad: "Unidad" },
  { id: "pan-12", nombre: "CACHITO", categoria: "Panadería", precio: 1.10, unidad: "Unidad" },
  { id: "pan-13", nombre: "RICOTA", categoria: "Panadería", precio: 2.09, unidad: "Unidad" },
  { id: "pan-14", nombre: "CRUASAN SAL", categoria: "Panadería", precio: 2.20, unidad: "Unidad" },
  { id: "pan-15", nombre: "PANINI", categoria: "Panadería", precio: 2.75, unidad: "Unidad" },
  { id: "pan-16", nombre: "POLLO C. MOZARELA", categoria: "Panadería", precio: 2.53, unidad: "Unidad" },
  { id: "pan-17", nombre: "MINI P.JAMON", categoria: "Panadería", precio: 2.50, unidad: "Unidad" },

  // 🚬 Cigarrillos y Varios
  { id: "cig-01", nombre: "CIGARRO BELMONT GRANDE", categoria: "Cigarrillos y Varios", precio: 2.45, unidad: "Unidad" },
  { id: "cig-02", nombre: "CIGARRO CONSUL", categoria: "Cigarrillos y Varios", precio: 1.32, unidad: "Unidad" },
  { id: "cig-03", nombre: "CIGARRO IBIZA", categoria: "Cigarrillos y Varios", precio: 1.20, unidad: "Unidad" },
  { id: "cig-04", nombre: "CIGARRO LUCKY COSMI", categoria: "Cigarrillos y Varios", precio: 1.84, unidad: "Unidad" },
  { id: "cig-05", nombre: "CIGARRO LUCKY NOVA /ECLIPSE", categoria: "Cigarrillos y Varios", precio: 2.96, unidad: "Unidad" },
  { id: "cig-06", nombre: "CIGARRO MARBORO", categoria: "Cigarrillos y Varios", precio: 2.23, unidad: "Unidad" },
  { id: "cig-07", nombre: "CIGARRO MARINE", categoria: "Cigarrillos y Varios", precio: 0.80, unidad: "Unidad" },
  { id: "cig-08", nombre: "CIGARRO NASHVILLE", categoria: "Cigarrillos y Varios", precio: 0.70, unidad: "Unidad" },
  { id: "cig-09", nombre: "CIGARRO PALL MAL", categoria: "Cigarrillos y Varios", precio: 2.45, unidad: "Unidad" },
  { id: "cig-10", nombre: "CIGARRO TIME", categoria: "Cigarrillos y Varios", precio: 0.87, unidad: "Unidad" },
  { id: "cig-11", nombre: "CIGARRO UNIVERSAL", categoria: "Cigarrillos y Varios", precio: 1.56, unidad: "Unidad" },
  { id: "cig-12", nombre: "CIGARRO VICERROY", categoria: "Cigarrillos y Varios", precio: 1.66, unidad: "Unidad" },
  { id: "cig-13", nombre: "YESQUERO BERNICE(LINTERNA)", categoria: "Cigarrillos y Varios", precio: 0.15, unidad: "Unidad" },
  { id: "cig-14", nombre: "YESQUERO BERNICE SOPLETE", categoria: "Cigarrillos y Varios", precio: 0.14, unidad: "Unidad" }
];


export default function App() {
  // --- ESTADOS GLOBALES ---
 // --- ESTADOS GLOBALES CON MEMORIA LOCAL (LOCALSTORAGE) ---
  const [modo, setModo] = useState('menu'); 
  const [usuarioActual, setUsuarioActual] = useState('sucursal');
  const [claveAdminInput, setClaveAdminInput] = useState('');
 const [nuevaAlertaAdmin, setNuevaAlertaAdmin] = useState(false);
  // Referencia para el sonido de alerta
const audioAlertaRef = useRef(null);
const dispararAlertaSonora = () => {
    if (audioAlertaRef && audioAlertaRef.current) {
      audioAlertaRef.current.play().catch(error => {
        console.log("Audio bloqueado:", error);
      });
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const mensajeVoz = new SpeechSynthesisUtterance("¡Atención! Hay una nueva requisición pendiente del Sambil.");
      mensajeVoz.lang = 'es-ES';
      mensajeVoz.rate = 1.0; 
      window.speechSynthesis.speak(mensajeVoz);
    }

// Catálogo de productos con persistencia automática en localStorage
// Catálogo de productos sincronizado con Supabase
const [productosCatalogo, setProductosCatalogo] = useState(PRODUCTOS_INICIALES_DB);


// Requisiciones con respaldo en LocalStorage
// Requisiciones sincronizadas desde Supabase
const [listaRequisiciones, setListaRequisiciones] = useState([]);

useEffect(() => {
  const cargarRequisicionesDeSupabase = async () => {
    const { data, error } = await supabase.from('requisiciones').select('*');
    if (error) {
      console.error('Error al cargar requisiciones:', error);
    } else if (data) {
      // Dependiendo de cómo guardes los datos, aquí mapeamos la tabla
      setListaRequisiciones(data.map(item => item.datos || item));
    }
  };
  cargarRequisicionesDeSupabase();
}, []);

// Tasa BCV con memoria local
const [tasaBcv, setTasaBcv] = useState(() => {
    const guardada = localStorage.getItem('falcon_tasa_bcv');
    return guardada ? JSON.parse(guardada) : 30.50;
});
useEffect(() => {
    localStorage.setItem('falcon_tasa_bcv', JSON.stringify(tasaBcv));
}, [tasaBcv]);
useEffect(() => {
    localStorage.setItem('falcon_productos', JSON.stringify(productosCatalogo));
}, [productosCatalogo]);

  useEffect(() => {
    localStorage.setItem('falcon_requisiciones', JSON.stringify(listaRequisiciones));
  }, [listaRequisiciones]);
  
// Función manual para actualizar la tasa BCV desde el portal
const [cargandoBcvManual, setCargandoBcvManual] = useState(false);

const actualizarTasaBcvManual = async () => {
    setCargandoBcvManual(true);
    try {
      const res = await fetch("https://ve.dolarapi.com/v1/dolares/bcv");
      const data = await res.json();
      if (data && data.promedio) {
        const nuevaTasa = parseFloat(data.promedio);
        setTasaBcv(nuevaTasa);

                      // Guardar automáticamente en Supabase
        await supabase
          .from('tasa_bcv')
          .update({ valor: nuevaTasa })
          .eq('id', 1);

        alert("¡Tasa BCV actualizada y guardada en la nube con éxito!");
      }
    } catch (error) {
      console.log("No se pudo conectar:", error);
      alert("No se pudo conectar al servidor. Verifique su conexión.");
    } finally {
      setCargandoBcvManual(false);
    }
  };
 // Historial de procesos sincronizado con Supabase
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    const cargarHistorial = async () => {
      const { data, error } = await supabase
        .from('historial_procesos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error cargando historial:", error);
      } else {
        setHistorial(data);
      }
    };

    cargarHistorial();
  }, []);
  // Función para reproducir sonido de alerta
  const dispararAlertaSonora = () => {
    if (audioAlertaRef.current) {
      audioAlertaRef.current.play().catch(e => console.log("Audio bloqueado por el navegador:", e));
    }
  };

  // Lista de credenciales sincronizada con Supabase
  const [listaAdmins, setListaAdmins] = useState([]);

  useEffect(() => {
    const cargarUsuarios = async () => {
    const { data, error } = await supabase
        .from('usuarios_sistema')
        .select('*');

      if (error) {
        console.error("Error cargando usuarios:", error);
      } else if (data) {
        setListaAdmins(data);
      }
    };

    cargarUsuarios();
  }, []);
  const ingresarComoAdmin = (e) => {
    e.preventDefault();
    const adminEncontrado = listaAdmins.find(a => a.usuario === usuarioActual && a.clave === claveAdminInput);
    if (adminEncontrado || (usuarioActual === 'admin' && claveAdminInput === 'falcon2026')) {
      setModo('admin');
      setClaveAdminInput('');
    } else {
      alert("❌ Contraseña de Administrador incorrecta.");
    }
  };

  return (
   
   <div style={{ backgroundColor: '#0b0f19', color: '#f3f4f6', minHeight: '100vh', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      {/* Elemento de Audio oculto para alertas de nuevas requisiciones */}
      <audio ref={audioAlertaRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />

      {/* --- MENU PRINCIPAL DE ACCESO --- */}
      {modo === 'menu' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '450px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <img src={URL_LOGO} alt="Falcon Crest" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f59e0b', marginBottom: '20px' }} />
            <h1 style={{ color: '#f59e0b', fontSize: '24px', margin: '0 0 5px 0' }}>FALCON CREST</h1>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '30px' }}>Sistema de Requisiciones y Control de Quesos — Sambil Punto Fijo</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button 
                onClick={() => setModo('sucursal')} 
                style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                🏪 Ingresar Sucursal (Cafetín Sambil)
              </button>

              <div style={{ borderTop: '1px solid #374151', margin: '10px 0', paddingTop: '20px' }}>
               
                <h3 style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '10px' }}>🔑 Acceso Administrativo (Planta)</h3>
                <form onSubmit={ingresarComoAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <select 
                    value={usuarioActual} 
                    onChange={e => setUsuarioActual(e.target.value)}
                    style={{ backgroundColor: '#1f2937', color: '#fff', border: '1px solid #4b5563', padding: '10px', borderRadius: '8px', fontSize: '13px' }}
                  >
                    {listaAdmins.map(a => (
                      <option key={a.usuario} value={a.usuario}>Administrador: {a.usuario}</option>
                    ))}
                  </select>
                  <input 
                    type="password" 
                    placeholder="Contraseña de Administrador" 
                    value={claveAdminInput}
                    onChange={e => setClaveAdminInput(e.target.value)}
                    style={{ backgroundColor: '#1f2937', color: '#fff', border: '1px solid #4b5563', padding: '10px', borderRadius: '8px', fontSize: '13px' }}
                  />
                  <button 
                    type="submit" 
                    style={{ backgroundColor: '#f59e0b', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
                  >
                    🔓 Entrar al Panel de Control
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODULO DE SUCURSAL (CAFETÍN SAMBIL) --- */}
      {modo === 'sucursal' && (
        <VistaSucursal 
 actualizarTasaBcvManual={actualizarTasaBcvManual}
cargandoBcvManual={cargandoBcvManual}
         onVolverAlMenu={() => setModo('menu')}
          productosCatalogo={productosCatalogo}
          listaRequisiciones={listaRequisiciones}
          setListaRequisiciones={setListaRequisiciones}
          tasaBcv={tasaBcv}
          setTasaBcv={setTasaBcv}
          dispararAlertaSonora={dispararAlertaSonora}
          setNuevaAlertaAdmin={setNuevaAlertaAdmin}
        />
      )}

      {/* --- MODULO ADMINISTRATIVO (PLANTA / CONTROL) --- */}
      {modo === 'admin' && (
        <PanelAdmin 
         actualizarTasaBcvManual={actualizarTasaBcvManual}
cargandoBcvManual={cargandoBcvManual}
                usuarioActual={usuarioActual}
          onVolverAlMenu={() => setModo('menu')}
          listaRequisiciones={listaRequisiciones}
          setListaRequisiciones={setListaRequisiciones}
          listaAdmins={listaAdmins}
          setListaAdmins={setListaAdmins}
          nuevaAlertaAdmin={nuevaAlertaAdmin}
          setNuevaAlertaAdmin={setNuevaAlertaAdmin}
          productosCatalogo={productosCatalogo}
          setProductosCatalogo={setProductosCatalogo}
tasaBcv={tasaBcv}
        />
      )}{modo !== 'sucursal' && (
  <BannerNuevaRequisicion 
    nuevaAlertaAdmin={nuevaAlertaAdmin} 
    setNuevaAlertaAdmin={setNuevaAlertaAdmin} 
  />
)}
    </div>
  );
}

// ==========================================
// COMPONENTE: VISTA SUCURSAL (CAFETÍN SAMBIL)
// ==========================================
function VistaSucursal({ onVolverAlMenu, productosCatalogo, setListaRequisiciones, tasaBcv, setTasaBcv, dispararAlertaSonora, setNuevaAlertaAdmin }) {
  const [requisicion, setRequisicion] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('TODOS');
  
  const [prioridad, setPrioridad] = useState('Normal');
  const [telefonoWhatsApp, setTelefonoWhatsApp] = useState('584120000000');
  const [correoDestino, setCorreoDestino] = useState('produccion@falconcrest.com');
  const [observaciones, setObservaciones] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

const categorias = [
  'TODOS', 
  'Panadería', 
  'Pastelería', 
  'Bebidas', 
  'Golosinas y Chocolates', 
  'Galletas y Snacks', 
  'Lácteos y Cafés', 
  'Empaques y Descartables', 
  'Cigarrillos y Varios'
];

  const agregarAlCarrito = (producto) => {
    setRequisicion(prev => {
      const actual = prev[producto.id] ? prev[producto.id].cantidad : 0;
      return {
        ...prev,
        [producto.id]: { ...producto, cantidad: actual + 1 }
      };
    });
  };

  const actualizarCantidad = (id, cantidadStr) => {
    const cantidad = parseInt(cantidadStr) || 0;
    setRequisicion(prev => {
      const copia = { ...prev };
      if (cantidad <= 0) {
        delete copia[id];
      } else {
        copia[id].cantidad = cantidad;
      }
      return copia;
    });
  };

  const totalItems = Object.values(requisicion).reduce((acc, item) => acc + item.cantidad, 0);
  const totalUSD = Object.values(requisicion).reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const totalBS = totalUSD * tasaBcv;

  const generarTextoOrden = () => {
    let texto = `*FALCON CREST - REQUISICIÓN SAMBIL*\n`;
    texto += `📅 Fecha: ${new Date().toLocaleString()}\n`;
    texto += `⚡ Prioridad: *${prioridad}*\n`;
    texto += `📌 Observaciones: ${observaciones || 'Ninguna'}\n\n`;
    texto += `--- DETALLE DE ARTÍCULOS ---\n`;
    
    Object.values(requisicion).forEach(item => {
      texto += `• ${item.cantidad} ${item.unidad} - ${item.nombre} ($${(item.precio * item.cantidad).toFixed(2)})\n`;
    });

    texto += `\n--------------------------\n`;
    texto += `*TOTAL USD: $${totalUSD.toFixed(2)}*\n`;
    texto += `*TOTAL BS (Tasa: ${tasaBcv}): Bs. ${totalBS.toFixed(2)}*\n`;
    return texto;
  };

 const enviarRequisicionAPlanta = async () => {
    if (Object.keys(requisicion).length === 0) {
      alert("⚠️ La requisición está vacía. Seleccione al menos un producto.");
      return;
    }

    const nuevaOrden = {
      id: 'REQ-' + Math.floor(1000 + Math.random() * 9000),
      sucursal: 'Cafetín Sambil',
      fecha: new Date().toLocaleString(),
      prioridad,
      observaciones,
      items: Object.values(requisicion),
      totalUSD,
      totalBS,
     tasaBcvAplicada: Number(tasaBcv) || 1,
      estatus: 'Pendiente ⏳'
    };
// --- GUARDAR EN LA NUBE (SUPABASE) ---
    await guardarRequisicionEnNube(nuevaOrden);


    setListaRequisiciones(prev => [nuevaOrden, ...prev]);
    setNuevaAlertaAdmin(true);
    dispararAlertaSonora();

    setMensajeExito("¡Requisición enviada con éxito a Planta / Producción!");
    setTimeout(() => setMensajeExito(''), 4000);
    setRequisicion({});
    setObservaciones('');
  };
   
  
  const enviarPorWhatsApp = () => {
    if (Object.keys(requisicion).length === 0) {
      alert("⚠️ Agregue productos antes de enviar por WhatsApp.");
      return;
    }
    const texto = encodeURIComponent(generarTextoOrden());
    window.open(`https://api.whatsapp.com/send?phone=${telefonoWhatsApp}&text=${texto}`, '_blank');
  };

  const enviarPorCorreo = () => {
    if (Object.keys(requisicion).length === 0) {
      alert("⚠️ Agregue productos antes de enviar por Correo.");
      return;
    }
    const asunto = encodeURIComponent(`Requisición Falcon Crest - Sambil (${new Date().toLocaleDateString()})`);
    const textoCorreo = generarTextoOrden().replace(/\*/g, '');
    const url = `mailto:${correoDestino}?subject=${asunto}&body=${encodeURIComponent(textoCorreo)}`;
    
    const enlace = document.createElement('a');
    enlace.href = url;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
  };

  const productosFiltrados = productosCatalogo.filter(p => {
    const coincideCat = categoriaSeleccionada === 'TODOS' || p.categoria.toLowerCase() === categoriaSeleccionada.toLowerCase();
    const coincideBusq = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCat && coincideBusq;
  });

  return (
    <div style={{ backgroundColor: '#0b0f19', color: '#f3f4f6', minHeight: '100vh', padding: '20px' }}>
      {/* Cabecera Sucursal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827', padding: '15px 25px', borderRadius: '12px', border: '1px solid #1f2937', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src={URL_LOGO} alt="Falcon Crest" style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #f59e0b' }} />
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b', margin: 0 }}>FALCON CREST</h1>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Sucursal Sambil Punto Fijo | Usuario: <strong style={{ color: '#34d399' }}>Sucursal Única</strong></span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1f2937', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', color: '#34d399' }}>
  <span>Tasa BCV (Bs):</span>
  <input 
    type="number"
    value={tasaBcv}
    onChange={(e) => setTasaBcv(e.target.value)}
    style={{ padding: '4px', fontSize: '13px', width: '80px', textAlign: 'center', borderRadius: '4px', border: '1px solid #4b5563', background: '#111827', color: '#fff' }}
  />
  <button 
    onClick={() => {
      localStorage.setItem("falcon_tasa_bcv", JSON.stringify(tasaBcv));
      alert("¡Tasa BCV guardada con éxito!");
    }}
    style={{ padding: '4px 10px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
  >
    Guardar
  </button>
</div>
          <button onClick={onVolverAlMenu} style={{ backgroundColor: '#374151', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🏠 Menú Principal</button>
        </div>
      </div>

      {mensajeExito && (
        <div style={{ backgroundColor: '#059669', color: '#fff', padding: '14px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' }}>
          {mensajeExito}
        </div>
      )}

      {/* Grid Principal Catálogo y Carrito */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px' }}>
        <div>
          <div style={{ marginBottom: '15px' }}>
            <input 
              type="text" 
              placeholder="🔍 Buscar artículo (Pan, Queso, Café...)..." 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)} 
              style={{ width: '100%', backgroundColor: '#111827', border: '1px solid #374151', padding: '12px', borderRadius: '8px', color: '#fff', outline: 'none' }} 
            />
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
            {categorias.map(cat => (
              <button 
                key={cat} 
                onClick={() => setCategoriaSeleccionada(cat)} 
                style={{ padding: '8px 16px', backgroundColor: categoriaSeleccionada === cat ? '#f59e0b' : '#111827', color: categoriaSeleccionada === cat ? '#000' : '#d1d5db', border: '1px solid', borderColor: categoriaSeleccionada === cat ? '#f59e0b' : '#374151', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
              >
                {cat === 'Quesos / Despacho' ? '🧀 Quesos / Despacho' : cat}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px', maxHeight: '58vh', overflowY: 'auto' }}>
            {productosFiltrados.map(prod => (
              <div key={prod.id} style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', color: prod.categoria === 'Quesos / Despacho' ? '#f59e0b' : '#9ca3af', fontWeight: 'bold' }}>
                    {prod.categoria}
                  </span>
                  <h4 style={{ fontSize: '14px', margin: '8px 0', color: '#fff' }}>{prod.nombre}</h4>
                  <p style={{ fontSize: '14px', color: '#34d399', margin: '0 0 14px 0', fontWeight: 'bold' }}>
                    ${prod.precio.toFixed(2)} <span style={{ fontSize: '11px', color: '#9ca3af' }}>/ {prod.unidad}</span>
                  </p>
                </div>
                <button onClick={() => agregarAlCarrito(prod)} style={{ width: '100%', backgroundColor: prod.categoria === 'Quesos / Despacho' ? '#d97706' : '#f59e0b', color: '#000', border: 'none', padding: '9px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  + Agregar
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Panel de Requisición Activa / Carrito */}
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '20px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '16px', borderBottom: '1px solid #374151', paddingBottom: '10px', marginBottom: '12px', color: '#f59e0b' }}>
            🛒 Requisición Actual ({totalItems})
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '3px' }}>PRIORIDAD</label>
              <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)} style={{ width: '100%', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', padding: '8px', borderRadius: '6px', fontSize: '12px' }}>
                <option value="Normal">Normal</option>
                <option value="Urgente">Urgente ⚡</option>
                <option value="Baja">Baja</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '3px' }}>WHATSAPP DESTINO</label>
              <input type="text" value={telefonoWhatsApp} onChange={(e) => setTelefonoWhatsApp(e.target.value)} style={{ width: '100%', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', padding: '8px', borderRadius: '6px', fontSize: '12px' }} />
            </div>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '3px' }}>CORREO DESTINO</label>
            <input type="email" value={correoDestino} onChange={(e) => setCorreoDestino(e.target.value)} style={{ width: '100%', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', padding: '8px', borderRadius: '6px', fontSize: '12px' }} />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '3px' }}>OBSERVACIONES / NOTAS DE DESPACHO</label>
            <textarea placeholder="Ej. Despacho urgente de queso para el turno de la tarde..." value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows="2" style={{ width: '100%', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #374151', padding: '6px', borderRadius: '6px', resize: 'none', fontSize: '12px' }} />
          </div>

          <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '10px', borderTop: '1px solid #1f2937', paddingTop: '8px' }}>
            {Object.keys(requisicion).length === 0 ? (
              <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', margin: '15px 0' }}>No hay artículos seleccionados</p>
            ) : (
              Object.values(requisicion).map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nombre}</span>
                  <input type="number" min="0.1" step="any" value={item.cantidad} onChange={(e) => actualizarCantidad(item.id, e.target.value)} style={{ width: '45px', textAlign: 'center', backgroundColor: '#374151', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px' }} />
                  <span style={{ marginLeft: '8px', color: '#34d399', width: '55px', textAlign: 'right', fontWeight: 'bold' }}>${(item.precio * item.cantidad).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>

          <div style={{ borderTop: '1px solid #374151', paddingTop: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}><span>Total USD:</span><span style={{ color: '#34d399' }}>${totalUSD.toFixed(2)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px' }}><span>Total BS:</span><span style={{ color: '#f59e0b' }}>Bs. {totalBS.toFixed(2)}</span></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={enviarRequisicionAPlanta} style={{ width: '100%', backgroundColor: '#059669', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
              🚀 Enviar Requisición a Planta
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button onClick={enviarPorWhatsApp} style={{ backgroundColor: '#25D366', color: '#000', border: 'none', padding: '9px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>💬 WhatsApp</button>
              <button onClick={enviarPorCorreo} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '9px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>✉️ Correo</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: PANEL ADMINISTRATIVO
// ==========================================
function PanelAdmin({ usuarioActual, onVolverAlMenu, listaRequisiciones, setListaRequisiciones, listaAdmins, setListaAdmins, nuevaAlertaAdmin, setNuevaAlertaAdmin, productosCatalogo, setProductosCatalogo, tasaBcv, setTasaBcv }) {
  const [pestana, setPestana] = useState('requisiciones');
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

  const [userSeleccionado, setUserSeleccionado] = useState(listaAdmins[0]?.usuario || '');
  const [nuevaClave, setNuevaClave] = useState('');
  const [msgClave, setMsgClave] = useState('');
  const [alertaAdminMsg, setAlertaAdminMsg] = useState('');

  const [busqAdmin, setBusqAdmin] = useState('');
  const [precioEditando, setPrecioEditando] = useState({});

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaCat, setNuevaCat] = useState('Panadería');
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [nuevaUnidad, setNuevaUnidad] = useState('Unidad');

  const categoriasDisponibles = ['Panadería', 'Pastelería', 'Bebidas', 'Insumos / Limpieza'];
  const unidadesDisponibles = ['Unidad', 'Kg', 'Paquete', 'Litro', 'Porción', 'Bobina'];

  const cambiarPestana = (nombrePestana) => {
    setPestana(nombrePestana);
    if (nombrePestana === 'requisiciones') {
      setNuevaAlertaAdmin(false);
    }
  };

  const cambiarEstatusOrden = (idOrden, nuevoEstatus) => {
    setListaRequisiciones(prev => prev.map(o => o.id === idOrden ? { ...o, estatus: nuevoEstatus } : o));
    if (ordenSeleccionada && ordenSeleccionada.id === idOrden) {
      setOrdenSeleccionada(prev => ({ ...prev, estatus: nuevoEstatus }));
    }
  };

  const eliminarOrden = (idOrden) => {
    if (window.confirm(`⚠️ ¿Estás seguro de eliminar permanentemente la orden ${idOrden}?`)) {
      setListaRequisiciones(prev => prev.filter(o => o.id !== idOrden));
      if (ordenSeleccionada?.id === idOrden) setOrdenSeleccionada(null);
      setAlertaAdminMsg(`🗑️ Orden ${idOrden} eliminada correctamente.`);
      setTimeout(() => setAlertaAdminMsg(''), 4000);
    }
  };

  const imprimirOrden = (orden) => {
    const ventanaImpresion = window.open('', '_blank');
    ventanaImpresion.document.write(`
      <html>
        <head>
          <title>Nota de Entrega / Requisición - ${orden.id}</title>
          <style>
            body { font-family: monospace; padding: 20px; color: #000; }
            h2, h4 { margin: 0 0 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border-bottom: 1px solid #ccc; padding: 6px; text-align: left; font-size: 12px; }
            .total { font-weight: bold; margin-top: 15px; font-size: 14px; }
          </style>
        </head>
        <body>
          <h2>FALCON CREST - PLANTA / PRODUCCIÓN</h2>
          <p><b>Nota de Entrega / Requisición:</b> ${orden.id}</p>
          <p><b>Sucursal:</b> ${orden.sucursal} (Sambil)</p>
          <p><b>Fecha:</b> ${orden.fecha}</p>
          <p><b>Prioridad:</b> ${orden.prioridad}</p>
          <p><b>Estatus:</b> ${orden.estatus}</p>
          <p><b>Observaciones:</b> ${orden.observaciones || 'Ninguna'}</p>
          <table>
            <thead>
              <tr><th>Cant.</th><th>Artículo</th><th>Presentación</th><th>Subtotal ($)</th></tr>
            </thead>
            <tbody>
              ${orden.items.map(i => `<tr><td>${i.cantidad}</td><td>${i.nombre}</td><td>${i.unidad}</td><td>$${(i.precio * i.cantidad).toFixed(2)}</td></tr>`).join('')}
            </tbody>
          </table>
          <div class="total">
            <p>Total USD: $${orden.totalUSD.toFixed(2)}</p>
            <p>Total BS (Tasa ${orden.tasaBcvAplicada || tasaBcv}): Bs. ${orden.totalBS.toFixed(2)}</p>
          </div>
          <br/><br/>
          <hr/>
          <p style="text-align:center; font-size:10px;">Firma de Despacho / Almacén</p>
        </body>
      </html>
    `);
    ventanaImpresion.document.close();
    ventanaImpresion.focus();
    setTimeout(() => ventanaImpresion.print(), 500);
  };

  const handleActualizarClave = (e) => {
    e.preventDefault();
    if (!nuevaClave.trim()) {
      alert("⚠️ La contraseña no puede estar vacía.");
      return;
    }
    setListaAdmins(prev => prev.map(a => a.usuario === userSeleccionado ? { ...a, clave: nuevaClave } : a));
    setMsgClave(`✅ Contraseña actualizada con éxito para [${userSeleccionado}]`);
    setNuevaClave('');
    setTimeout(() => setMsgClave(''), 4000);
  };

  const guardarPrecioProducto = (id) => {
    const prec = parseFloat(precioEditando[id]);
    if (isNaN(prec) || prec < 0) {
      alert("⚠️ Ingrese un precio válido.");
      return;
    }
    setProductosCatalogo(prev => prev.map(p => p.id === id ? { ...p, precio: prec } : p));
    setAlertaAdminMsg(`✅ Precio actualizado correctamente.`);
    setTimeout(() => setAlertaAdminMsg(''), 3000);
  };

  const handleCrearProducto = (e) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !nuevoPrecio) {
      alert("⚠️ Por favor completa el nombre y el precio en USD.");
      return;
    }

    const itemNuevo = {
      id: 'p-' + Date.now(),
      nombre: nuevoNombre.trim().toUpperCase(),
      categoria: nuevaCat,
      precio: parseFloat(nuevoPrecio),
      unidad: nuevaUnidad
    };

    setProductosCatalogo(prev => [itemNuevo, ...prev]);
    setNuevoNombre('');
    setNuevoPrecio('');
    setAlertaAdminMsg(`✅ ¡Artículo "${itemNuevo.nombre}" creado con éxito!`);
    setTimeout(() => setAlertaAdminMsg(''), 4000);
  };

  const handleBorrarProducto = (id, nombre) => {
    if (window.confirm(`⚠️ ¿Deseas eliminar permanentemente el producto "${nombre}" del catálogo?`)) {
      setProductosCatalogo(prev => prev.filter(p => p.id !== id));
      setAlertaAdminMsg(`🗑️ Producto "${nombre}" eliminado del sistema.`);
      setTimeout(() => setAlertaAdminMsg(''), 3000);
    }
  };

  const productosAdminFiltrados = productosCatalogo.filter(p => p.nombre.toLowerCase().includes(busqAdmin.toLowerCase()));

  return (
    <div style={{ backgroundColor: '#0b0f19', color: '#fff', minHeight: '100vh', padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827', padding: '15px 25px', borderRadius: '12px', border: '1px solid #1f2937', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src={URL_LOGO} alt="Falcon Crest" style={{ width: '45px', height: '45px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #f59e0b' }} />
          <div>
            <h2 style={{ color: '#f59e0b', fontSize: '20px', margin: 0 }}>FALCON CREST - Panel Planta y Control</h2>
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>Sesión Admin: <strong style={{ color: '#34d399' }}>{usuarioActual}</strong></span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ backgroundColor: '#1f2937', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', color: '#34d399', border: '1px solid #374151', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Tasa BCV (Bs):</span>
            <input type="number" step="0.01" value={tasaBcv} onChange={(e) => setTasaBcv(parseFloat(e.target.value) || 0)} style={{ width: '75px', backgroundColor: '#111827', color: '#34d399', border: '1px solid #4b5563', borderRadius: '4px', padding: '2px 6px', fontWeight: 'bold' }} />
          </div>
          <button onClick={onVolverAlMenu} style={{ padding: '10px 20px', backgroundColor: '#374151', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🏠 Menú Principal</button>
        </div>
      </div>

      {/* Alerta Visual Animada */}
{nuevaAlertaAdmin && (
  <div style={{
    backgroundColor: '#10B981',
    color: '#fff',
    padding: '16px 24px',
    borderRadius: '12px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: 'bold',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    fontSize: '15px'
  }}>
    <span>🔔 ¡Atención! Se ha recibido una nueva requisición en el sistema.</span>
    <button 
     onClick={() => setNuevaAlertaAdmin(false)}
      style={{
        background: 'transparent',
        border: 'none',
        color: '#fff',
        fontSize: '18px',
        cursor: 'pointer',
        fontWeight: 'bold'
      }}
    >
      ✕
    </button>
  </div>

      )}

      {alertaAdminMsg && (
        <div style={{ backgroundColor: '#059669', color: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', textAlign: 'center' }}>
          {alertaAdminMsg}
        </div>
      )}

      {/* Botones de Pestañas Admin */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => cambiarPestana('requisiciones')} style={{ padding: '10px 20px', backgroundColor: pestana === 'requisiciones' ? '#f59e0b' : '#111827', color: pestana === 'requisiciones' ? '#000' : '#fff', border: '1px solid #374151', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', position: 'relative' }}>
          📦 Requisiciones y Notas ({listaRequisiciones.length})
          {nuevaAlertaAdmin && <span style={{ position: 'absolute', top: '-5px', right: '-5px', width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '50%', border: '2px solid #111827' }}></span>}
        </button>
        <button onClick={() => cambiarPestana('precios')} style={{ padding: '10px 20px', backgroundColor: pestana === 'precios' ? '#f59e0b' : '#111827', color: pestana === 'precios' ? '#000' : '#fff', border: '1px solid #374151', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>💰 Modificar Precios</button>
        <button onClick={() => cambiarPestana('crear_producto')} style={{ padding: '10px 20px', backgroundColor: pestana === 'crear_producto' ? '#f59e0b' : '#111827', color: pestana === 'crear_producto' ? '#000' : '#fff', border: '1px solid #374151', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>➕ Gestionar Artículos</button>
        <button onClick={() => cambiarPestana('seguridad')} style={{ padding: '10px 20px', backgroundColor: pestana === 'seguridad' ? '#f59e0b' : '#111827', color: pestana === 'seguridad' ? '#000' : '#fff', border: '1px solid #374151', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>🔐 Claves Admin</button>
      </div>

      {/* PESTAÑA 1: REQUISICIONES Y NOTAS DE ENTREGA */}
      {pestana === 'requisiciones' && (
        <div style={{ display: 'grid', gridTemplateColumns: ordenSeleccionada ? '1fr 400px' : '1fr', gap: '20px' }}>
          <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '12px', border: '1px solid #1f2937' }}>
            <h3 style={{ color: '#f59e0b', margin: '0 0 15px 0' }}>Control de Órdenes y Salida de Insumos</h3>
            {listaRequisiciones.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', border: '2px dashed #374151', borderRadius: '8px', color: '#6b7280' }}>
                No hay requisiciones registradas por la sucursal todavía.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #374151', color: '#9ca3af' }}>
                      <th style={{ padding: '10px' }}>ID Orden</th>
                      <th style={{ padding: '10px' }}>Fecha</th>
                      <th style={{ padding: '10px' }}>Prioridad</th>
                      <th style={{ padding: '10px' }}>Total ($)</th>
                      <th style={{ padding: '10px' }}>Estatus</th>
                      <th style={{ padding: '10px' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaRequisiciones.map(ord => (
                      <tr key={ord.id} style={{ borderBottom: '1px solid #1f2937', backgroundColor: ordenSeleccionada?.id === ord.id ? '#1f2937' : 'transparent' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold', color: '#f59e0b' }}>{ord.id}</td>
                        <td style={{ padding: '10px', color: '#9ca3af', fontSize: '12px' }}>{ord.fecha}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', backgroundColor: ord.prioridad === 'Urgente ⚡' || ord.prioridad === 'Urgente' ? '#7f1d1d' : '#374151', color: '#fff' }}>
                            {ord.prioridad}
                          </span>
                        </td>
                        <td style={{ padding: '10px', color: '#34d399', fontWeight: 'bold' }}>${ord.totalUSD.toFixed(2)}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{ord.estatus}</td>
                        <td style={{ padding: '10px', display: 'flex', gap: '6px' }}>
                          <button onClick={() => setOrdenSeleccionada(ord)} style={{ background: '#374151', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Ver</button>
                          <button onClick={() => imprimirOrden(ord)} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🖨️</button>
                          <button onClick={() => eliminarOrden(ord.id)} style={{ backgroundColor: '#7f1d1d', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {ordenSeleccionada && (
            <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '12px', border: '1px solid #374151', height: 'fit-content' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #374151', paddingBottom: '10px', marginBottom: '15px' }}>
                <h4 style={{ color: '#f59e0b', margin: 0 }}>Detalle: {ordenSeleccionada.id}</h4>
                <button onClick={() => setOrdenSeleccionada(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>✕</button>
              </div>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '5px 0' }}><strong>Sucursal:</strong> {ordenSeleccionada.sucursal}</p>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '5px 0' }}><strong>Fecha:</strong> {ordenSeleccionada.fecha}</p>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '5px 0' }}><strong>Observaciones:</strong> {ordenSeleccionada.observaciones || 'Ninguna'}</p>
              
              <div style={{ margin: '15px 0' }}>
                <label style={{ fontSize: '12px', color: '#f59e0b', display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ACTUALIZAR ESTATUS</label>
                <select 
                  value={ordenSeleccionada.estatus} 
                  onChange={(e) => cambiarEstatusOrden(ordenSeleccionada.id, e.target.value)}
                  style={{ width: '100%', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #4b5563', padding: '8px', borderRadius: '6px', outline: 'none', fontWeight: 'bold' }}
                >
                  <option value="Pendiente ⏳">Pendiente ⏳</option>
                  <option value="En Proceso 🔄">En Proceso 🔄</option>
                  <option value="Aprobado / Despachado ✅">Aprobado / Despachado ✅</option>
                  <option value="Cancelado ❌">Cancelado ❌</option>
                </select>
              </div>

              <div style={{ maxHeight: '180px', overflowY: 'auto', borderTop: '1px solid #1f2937', paddingTop: '10px', marginBottom: '15px' }}>
                {ordenSeleccionada.items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span>{it.cantidad} {it.unidad} - {it.nombre}</span>
                    <span style={{ color: '#34d399' }}>${(it.precio * it.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #374151', paddingTop: '10px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px' }}><span>Total USD:</span><span style={{ color: '#34d399' }}>${ordenSeleccionada.totalUSD.toFixed(2)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginTop: '4px' }}><span>Total BS:</span><span style={{ color: '#f59e0b' }}>Bs. {ordenSeleccionada.totalBS.toFixed(2)}</span></div>
              </div>

              <button onClick={() => imprimirOrden(ordenSeleccionada)} style={{ width: '100%', backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                🖨️ Imprimir Nota de Despacho
              </button>
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: MODIFICAR PRECIOS */}
      {pestana === 'precios' && (
        <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '12px', border: '1px solid #1f2937' }}>
          <h3 style={{ color: '#f59e0b', margin: '0 0 15px 0' }}>Modificación de Precios en USD (Catálogo y Quesos)</h3>
          <div style={{ marginBottom: '15px' }}>
            <input type="text" placeholder="🔍 Buscar producto para editar precio..." value={busqAdmin} onChange={(e) => setBusqAdmin(e.target.value)} style={{ width: '100%', backgroundColor: '#1f2937', border: '1px solid #374151', padding: '10px', borderRadius: '8px', color: '#fff', outline: 'none' }} />
          </div>
          <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #374151', color: '#9ca3af' }}>
                  <th style={{ padding: '10px' }}>Artículo</th>
                  <th style={{ padding: '10px' }}>Categoría</th>
                  <th style={{ padding: '10px' }}>Unidad</th>
                  <th style={{ padding: '10px' }}>Precio Actual ($)</th>
                  <th style={{ padding: '10px' }}>Nuevo Precio ($)</th>
                  <th style={{ padding: '10px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {productosAdminFiltrados.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #1f2937' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>{p.nombre}</td>
                    <td style={{ padding: '10px', color: p.categoria === 'Quesos / Despacho' ? '#f59e0b' : '#9ca3af' }}>{p.categoria}</td>
                    <td style={{ padding: '10px', color: '#38bdf8' }}>{p.unidad}</td>
                    <td style={{ padding: '10px', color: '#34d399', fontWeight: 'bold' }}>${p.precio.toFixed(2)}</td>
                    <td style={{ padding: '10px' }}>
                      <input 
                        type="number" 
                        step="0.01" 
                        placeholder={p.precio.toFixed(2)}
                        value={precioEditando[p.id] !== undefined ? precioEditando[p.id] : ''}
                        onChange={(e) => setPrecioEditando({ ...precioEditando, [p.id]: e.target.value })}
                        style={{ width: '90px', backgroundColor: '#1f2937', color: '#fff', border: '1px solid #4b5563', padding: '5px', borderRadius: '6px' }} 
                      />
                    </td>
                    <td style={{ padding: '10px' }}>
                      <button onClick={() => guardarPrecioProducto(p.id)} style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Actualizar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: CREAR / BORRAR ARTÍCULOS */}
      {pestana === 'crear_producto' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ backgroundColor: '#111827', padding: '25px', borderRadius: '12px', border: '1px solid #1f2937' }}>
            <h3 style={{ color: '#f59e0b', margin: '0 0 15px 0' }}>➕ Crear Nuevo Artículo</h3>
            <form onSubmit={handleCrearProducto}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>NOMBRE</label>
                <input type="text" placeholder="Ej. QUESO GOUDA BLOC..." value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} style={{ width: '100%', backgroundColor: '#1f2937', border: '1px solid #374151', padding: '10px', borderRadius: '8px', color: '#fff', outline: 'none' }} />
              </div>

              <div style={{ marginBottom: '12px' }}>
 <div style={{ marginBottom: '12px' }}></div>
  <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>CATEGORÍA</label>
  <select 
    value={nuevaCat} 
    onChange={(e) => setNuevaCat(e.target.value)} 
    style={{ width: '100%', backgroundColor: '#111827', color: '#fff', border: '1px solid #374151', padding: '12px', borderRadius: '8px' }}
  >
    <option value="Panadería">Panadería</option>
    <option value="Pastelería">Pastelería</option>
    <option value="Bebidas">Bebidas</option>
    <option value="Golosinas y Chocolates">Golosinas y Chocolates</option>
    <option value="Galletas y Snacks">Galletas y Snacks</option>
    <option value="Lácteos y Cafés">Lácteos y Cafés</option>
    <option value="Empaques y Descartables">Empaques y Descartables</option>
    <option value="Cigarrillos y Varios">Cigarrillos y Varios</option>
  </select>
</div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>UNIDAD</label>
                <select value={nuevaUnidad} onChange={(e) => setNuevaUnidad(e.target.value)} style={{ width: '100%', backgroundColor: '#1f2937', border: '1px solid #374151', padding: '10px', borderRadius: '8px', color: '#fff', outline: 'none' }}>
                  {unidadesDisponibles.map(uni => (
                    <option key={uni} value={uni}>{uni}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>PRECIO EN DÓLARES ($)</label>
                <input type="number" step="0.01" placeholder="0.00" value={nuevoPrecio} onChange={(e) => setNuevoPrecio(e.target.value)} style={{ width: '100%', backgroundColor: '#1f2937', border: '1px solid #374151', padding: '10px', borderRadius: '8px', color: '#fff', outline: 'none' }} />
              </div>

              <button type="submit" style={{ width: '100%', backgroundColor: '#f59e0b', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                🚀 Registrar Artículo
              </button>
            </form>
          </div>

          <div style={{ backgroundColor: '#111827', padding: '25px', borderRadius: '12px', border: '1px solid #1f2937' }}>
            <h3 style={{ color: '#ef4444', margin: '0 0 15px 0' }}>🗑️ Borrar Artículos</h3>
            <div style={{ marginBottom: '12px' }}>
              <input type="text" placeholder="🔍 Buscar para borrar..." value={busqAdmin} onChange={(e) => setBusqAdmin(e.target.value)} style={{ width: '100%', backgroundColor: '#1f2937', border: '1px solid #374151', padding: '10px', borderRadius: '8px', color: '#fff', outline: 'none' }} />
            </div>
            <div style={{ maxHeight: '40vh', overflowY: 'auto' }}>
              {productosAdminFiltrados.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1f2937', padding: '10px', borderRadius: '8px', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{p.nombre}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{p.categoria} | ${p.precio} / {p.unidad}</div>
                  </div>
                  <button onClick={() => handleBorrarProducto(p.id, p.nombre)} style={{ backgroundColor: '#7f1d1d', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Borrar</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 4: SEGURIDAD Y CLAVES */}
      {pestana === 'seguridad' && (
        <div style={{ backgroundColor: '#111827', padding: '25px', borderRadius: '12px', border: '1px solid #1f2937', maxWidth: '500px' }}>
          <h3 style={{ color: '#f59e0b', margin: '0 0 15px 0' }}>🔐 Cambio de Claves de Administradores</h3>
          {msgClave && <div style={{ backgroundColor: '#059669', color: '#fff', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontWeight: 'bold' }}>{msgClave}</div>}
          <form onSubmit={handleActualizarClave}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>SELECCIONAR ADMINISTRADOR</label>
              <select value={userSeleccionado} onChange={(e) => setUserSeleccionado(e.target.value)} style={{ width: '100%', backgroundColor: '#1f2937', border: '1px solid #374151', padding: '10px', borderRadius: '8px', color: '#fff' }}>
                {listaAdmins.map(a => (
                  <option key={a.usuario} value={a.usuario}>{a.usuario}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>NUEVA CONTRASEÑA</label>
              <input type="password" value={nuevaClave} onChange={(e) => setNuevaClave(e.target.value)} placeholder="Escribe la nueva contraseña..." style={{ width: '100%', backgroundColor: '#1f2937', border: '1px solid #374151', padding: '10px', borderRadius: '8px', color: '#fff' }} />
            </div>
            <button type="submit" style={{ width: '100%', backgroundColor: '#f59e0b', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              Actualizar Contraseña
            </button>
          </form>
        </div>
      )}
    </div>
  );<div style={{ margin: "20px 0", padding: "15px", background: "#f8f9fa", borderRadius: "8px", border: "1px solid #dee2e6", textAlign: "center" }}>
    <p style={{ margin: "0 0 8px 0", fontSize: "15px", fontWeight: "bold", color: "#333" }}>
        Tasa BCV Actual: {tasaBcv} Bs.
    </p>
    <button 
        onClick={actualizarTasaBcvManual} 
        disabled={cargandoBcvManual}
        style={{ 
            padding: "8px 16px", 
            cursor: "pointer", 
            background: "#007bff", 
            color: "#fff", 
            border: "none", 
            borderRadius: "4px",
            fontWeight: "bold"
        }}
    >
        {cargandoBcvManual ? "Consultando..." : "🔄 Actualizar Tasa BCV"}
    </button>
</div>
}// Función para guardar las Requisiciones en la nube (Supabase)
  const guardarRequisicionEnNube = async (detallesRequisicion) => {
    try {
      const { error } = await supabase
        .from('requisiciones')
        .insert([{ datos: detallesRequisicion }]);

      if (error) {
        console.error("Error al guardar la requisición en Supabase:", error);
      } else {
        console.log("Requisición guardada en la nube con éxito.");
      }
    } catch (err) {
      console.error("Error inesperado al guardar requisición:", err);
    }


function BannerNuevaRequisicion({ nuevaAlertaAdmin, setNuevaAlertaAdmin }) {
  if (!nuevaAlertaAdmin) return null;

  return (
    <div
      onClick={() => setNuevaAlertaAdmin(false)}
      style={{
        position: 'fixed',
        top: '70px',
        right: '25px',
        backgroundColor: '#EF4444',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: 'bold',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer'
      }}
    >
      <span>🚨</span>
      <span>¡Atención! Hay una nueva requisición pendiente. (Haz clic para cerrar)</span>
    </div>
);
};