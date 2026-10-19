// ============================================================
// SEED DATA - Lubaan Products
// ============================================================

const seedData = {
    // Admin Account (Mulkiilaha Nidaamka)
    admin: {
        name: "System Owner",
        email: "akiidonly12@gmail.com",
        password: "Akiid12345",
        phone: "+252634008040",
        country: "Somaliland"
    },

    // Business Account (Lubaan Products)
    business: {
        name: "Ridwan Farah",
        business: "Lubaan Products",
        email: "akiidonly12@gmail.com",
        phone: "+252634008040",
        phone_country: "252",
        language: "so",
        address: "Hargeisa, Somaliland",
        city: "Hargeisa",
        country: "Somaliland",
        tax_id: "SL-LUB-001"
    },

    // Products (Lubaan Dawada Ilkaha)
    products: [
        {
            name: "Lubaan Dawada Ilkaha - Xabbo",
            category: "Dental",
            price: 2.50,
            quantity: 1000,
            sku: "LUB-001",
            min_stock: 100,
            description: "Lubaanta Dawada Ilkaha - Hal xabbo"
        },
        {
            name: "Lubaan Dawada Ilkaha - Half Cartoon",
            category: "Dental",
            price: 90.00,
            quantity: 50,
            sku: "LUB-HC-36",
            min_stock: 10,
            description: "Half Kartoon (36 Pcs) - Qiimo dhimis"
        },
        {
            name: "Lubaan Dawada Ilkaha - Full Cartoon",
            category: "Dental",
            price: 180.00,
            quantity: 30,
            sku: "LUB-FC-72",
            min_stock: 5,
            description: "Kartoon Buuxa (72 Pcs) - Qiimo dhimis"
        },
        {
            name: "Lubaan Herbal - Xabbo",
            category: "Herbal",
            price: 3.00,
            quantity: 500,
            sku: "LUB-HB-001",
            min_stock: 50,
            description: "Lubaanta Herbalka - Hal xabbo"
        }
    ],

    // Locations (Goobaha Hargeisa)
    locations: [
        { name: "Paris Dental Clinic", address: "Waddada Gargar, kasoo horjeedka Ex-Nasiiba", city: "Hargeisa", type: "Kilinik" },
        { name: "Geesh Supermarket", address: "Masalaha", city: "Hargeisa", type: "Supermarket" },
        { name: "Ciir Supermarket", address: "Masalaha", city: "Hargeisa", type: "Supermarket" },
        { name: "Libax Pharmacy", address: "Suuqa Hoose, agagaarka istaanka baska Cabaye", city: "Hargeisa", type: "Pharmacy" },
        { name: "Boqljire Supermarket", address: "Galbeedka magaalada, xaafadda Boqljire, dhinaca Buurta Kala Jexan", city: "Hargeisa", type: "Supermarket" },
        { name: "Najax Dental Clinic", address: "Togdheer, kasoo horjeedka Fooqa Aadan Nayntiin", city: "Hargeisa", type: "Kilinik" },
        { name: "Gargar Dental Clinic", address: "Ku dheggan Dhakhtarka Gargar", city: "Hargeisa", type: "Kilinik" },
        { name: "Circle Supermarket", address: "Xaafadda Pepsi, bilowga waddada tagta Jaamacadda Hargeisa", city: "Hargeisa", type: "Supermarket" },
        { name: "Gafane Supermarket", address: "Waddada galbeedka, dhinaca Buurta Kala Jexan", city: "Hargeisa", type: "Supermarket" },
        { name: "Smile Zone Dental Clinic", address: "Saldhig Dhexe", city: "Hargeisa", type: "Kilinik" },
        { name: "Family Mart", address: "Goolada Sare ee Jigjiga Yar", city: "Hargeisa", type: "Supermarket" },
        { name: "Zirconi Dental Clinic", address: "Kasoo horjeedka Gym-ka Bilkhayr", city: "Hargeisa", type: "Kilinik" },
        { name: "Liiban Supermarket", address: "New Hargeisa", city: "Hargeisa", type: "Supermarket" },
        { name: "Salama Supermarket", address: "New Hargeisa, agagaarka Xero Trafic", city: "Hargeisa", type: "Supermarket" },
        { name: "Faraska Supermarket", address: "New Hargeisa", city: "Hargeisa", type: "Supermarket" },
        { name: "Indha-birta - National Supermarket", address: "Indha-birta", city: "Hargeisa", type: "Supermarket" },
        { name: "Jigjiga Yar - Idaacadda", address: "Jigjiga Yar, Idaacadda", city: "Hargeisa", type: "Supermarket" },
        { name: "Kaaraaha", address: "Kaaraaha", city: "Hargeisa", type: "Supermarket" },
        { name: "Horn Petroleum Supermarket - Suuqa Hoose", address: "Suuqa Hoose", city: "Hargeisa", type: "Supermarket" },
        { name: "Horn Petroleum Supermarket - Jigjiga Yar", address: "Jigjiga Yar", city: "Hargeisa", type: "Supermarket" },
        { name: "Jabane Supermarket", address: "Xero Awr", city: "Hargeisa", type: "Supermarket" },
        { name: "Star Supermarket", address: "Calamada", city: "Hargeisa", type: "Supermarket" },
        { name: "Jamila Herbal", address: "Suuqa Waaheen", city: "Hargeisa", type: "Herbal" },
        { name: "Kulmiye Store", address: "Suuqa Waaheen", city: "Hargeisa", type: "Supermarket" },
        { name: "West London Pharmacy - Jigjiga Yar", address: "Jigjiga Yar", city: "Hargeisa", type: "Pharmacy" },
        { name: "West London Pharmacy - Calamada", address: "Calamada", city: "Hargeisa", type: "Pharmacy" },
        { name: "Nuur Shop", address: "Cosob Mall, Jigjiga Yar", city: "Hargeisa", type: "Supermarket" },

        // Magaalooyin kale
        { name: "Saytuuni Herbals", address: "Kasoo horjeedka Mr Merchant", city: "Burco", type: "Herbal" },
        { name: "Boorama Herbal Center", address: "Kasoo horjeedka Telesom-ta weyn, una dhow Goljano Hotel", city: "Boorama", type: "Herbal" },
        { name: "Gabiley Supermarket", address: "Bartamaha Gabiley", city: "Gabiley", type: "Supermarket" },
        { name: "Wajaale Market", address: "Bartamaha Wajaale", city: "Wajaale", type: "Supermarket" },
        { name: "Berbera Supermarket", address: "Bartamaha Berbera", city: "Berbera", type: "Supermarket" }
    ]
};

module.exports = seedData;
