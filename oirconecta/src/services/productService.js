// Servicio para gestionar productos (cotizaciones, ventas, adaptaciones)

const PRODUCTS_KEY = 'oirconecta_patient_products';

/**
 * Obtiene todos los productos de pacientes
 * @returns {Object} Objeto con email como clave y array de productos como valor
 */
export const getAllPatientProducts = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return {};
  }

  try {
    const data = localStorage.getItem(PRODUCTS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return {};
  }
};

/**
 * Guarda todos los productos
 * @param {Object} products - Objeto con productos
 * @returns {boolean} true si se guardó correctamente
 */
const saveProducts = (products) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }

  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    // Disparar evento personalizado para actualización en tiempo real
    window.dispatchEvent(new CustomEvent('productsUpdated'));
    return true;
  } catch (error) {
    console.error('Error al guardar productos:', error);
    return false;
  }
};

/**
 * Obtiene los productos de un paciente específico
 * @param {string} patientEmail - Email del paciente
 * @returns {Array} Array de productos del paciente
 */
export const getPatientProducts = (patientEmail) => {
  const allProducts = getAllPatientProducts();
  return allProducts[patientEmail] || [];
};

/**
 * Agrega un producto a un paciente
 * @param {string} patientEmail - Email del paciente
 * @param {Object} productData - Datos del producto
 * @returns {Object} {success: boolean, product: Object|null, error: string|null}
 */
export const addPatientProduct = (patientEmail, productData) => {
  const {
    type, // 'quote', 'sale', 'adaptation'
    productName,
    brand,
    model,
    category, // 'hearing-aid', 'accessory', 'service'
    quantity,
    unitPrice,
    totalPrice,
    discount,
    status, // 'pending', 'approved', 'rejected', 'completed', 'delivered', 'adapted'
    quoteDate,
    saleDate,
    adaptationDate,
    deliveryDate,
    warrantyStartDate,
    warrantyEndDate,
    notes,
    relatedAppointmentId,
    metadata, // Objeto con datos adicionales
  } = productData;

  if (!patientEmail || !type || !productName) {
    return {
      success: false,
      product: null,
      error: 'Email, tipo y nombre del producto son obligatorios',
    };
  }

  const product = {
    id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    patientEmail,
    type,
    productName,
    brand: brand || '',
    model: model || '',
    category: category || 'hearing-aid',
    quantity: quantity || 1,
    unitPrice: unitPrice || 0,
    totalPrice: totalPrice || (unitPrice * (quantity || 1)),
    discount: discount || 0,
    status: status || (type === 'quote' ? 'pending' : type === 'sale' ? 'completed' : 'pending'),
    quoteDate: quoteDate || (type === 'quote' ? new Date().toISOString().split('T')[0] : null),
    saleDate: saleDate || (type === 'sale' ? new Date().toISOString().split('T')[0] : null),
    adaptationDate: adaptationDate || null,
    deliveryDate: deliveryDate || null,
    warrantyStartDate: warrantyStartDate || null,
    warrantyEndDate: warrantyEndDate || null,
    notes: notes || '',
    relatedAppointmentId: relatedAppointmentId || null,
    metadata: metadata || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const allProducts = getAllPatientProducts();
  if (!allProducts[patientEmail]) {
    allProducts[patientEmail] = [];
  }
  allProducts[patientEmail].push(product);
  
  // Ordenar por fecha de creación (más reciente primero)
  allProducts[patientEmail].sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  if (saveProducts(allProducts)) {
    return {
      success: true,
      product,
      error: null,
    };
  } else {
    return {
      success: false,
      product: null,
      error: 'Error al guardar el producto',
    };
  }
};

/**
 * Crea una cotización
 * @param {string} patientEmail - Email del paciente
 * @param {Object} quoteData - Datos de la cotización
 * @returns {Object} {success: boolean, product: Object|null, error: string|null}
 */
export const createQuote = (patientEmail, quoteData) => {
  return addPatientProduct(patientEmail, {
    type: 'quote',
    productName: quoteData.productName,
    brand: quoteData.brand,
    model: quoteData.model,
    category: quoteData.category || 'hearing-aid',
    quantity: quoteData.quantity || 1,
    unitPrice: quoteData.unitPrice,
    totalPrice: quoteData.totalPrice || (quoteData.unitPrice * (quoteData.quantity || 1)),
    discount: quoteData.discount || 0,
    status: 'pending',
    quoteDate: quoteData.quoteDate || new Date().toISOString().split('T')[0],
    notes: quoteData.notes || '',
    relatedAppointmentId: quoteData.relatedAppointmentId || null,
    metadata: {
      technology: quoteData.metadata?.technology || '',
      platform: quoteData.metadata?.platform || '',
      warrantyYears: quoteData.warrantyYears || quoteData.metadata?.warrantyYears || 1,
      bondades: quoteData.metadata?.bondades || '',
      images: quoteData.metadata?.images || [],
      patientName: quoteData.metadata?.patientName || '',
      patientEmail: quoteData.metadata?.patientEmail || patientEmail,
      patientPhone: quoteData.metadata?.patientPhone || '',
      validUntil: quoteData.validUntil || null,
      terms: quoteData.terms || '',
      rechargeable: quoteData.metadata?.rechargeable || '',
      seguroPerdidaRobo: quoteData.metadata?.seguroPerdidaRobo || '',
      seguroRotura: quoteData.metadata?.seguroRotura || '',
      campaignId: quoteData.metadata?.campaignId ?? null,
      campaignNombre: quoteData.metadata?.campaignNombre || '',
      fabricante: quoteData.metadata?.fabricante || '',
      campaignVigencia: quoteData.metadata?.campaignVigencia || '',
    },
  });
};

/**
 * Registra una venta
 * @param {string} patientEmail - Email del paciente
 * @param {Object} saleData - Datos de la venta
 * @returns {Object} {success: boolean, product: Object|null, error: string|null}
 */
export const recordSale = (patientEmail, saleData) => {
  return addPatientProduct(patientEmail, {
    type: 'sale',
    productName: saleData.productName,
    brand: saleData.brand,
    model: saleData.model,
    category: saleData.category || 'hearing-aid',
    quantity: saleData.quantity || 1,
    unitPrice: saleData.unitPrice,
    totalPrice: saleData.totalPrice || (saleData.unitPrice * (saleData.quantity || 1)),
    discount: saleData.discount || 0,
    status: 'completed',
    saleDate: saleData.saleDate || new Date().toISOString().split('T')[0],
    adaptationDate: saleData.adaptationDate || null,
    deliveryDate: saleData.deliveryDate || null,
    warrantyStartDate: saleData.warrantyStartDate || null,
    warrantyEndDate: saleData.warrantyEndDate || null,
    notes: saleData.notes || '',
    relatedAppointmentId: saleData.relatedAppointmentId || null,
    metadata: {
      technology: saleData.metadata?.technology || '',
      platform: saleData.metadata?.platform || '',
      warrantyYears: saleData.metadata?.warrantyYears || 1,
      bondades: saleData.metadata?.bondades || '',
      firstControlDate: saleData.metadata?.firstControlDate || null,
      firstMaintenanceDate: saleData.metadata?.firstMaintenanceDate || null,
      accessories: saleData.metadata?.accessories || [],
      comments: saleData.metadata?.comments || [],
      patientName: saleData.metadata?.patientName || '',
      patientEmail: saleData.metadata?.patientEmail || patientEmail,
      patientPhone: saleData.metadata?.patientPhone || '',
      paymentMethod: saleData.paymentMethod || '',
      paymentStatus: saleData.paymentStatus || 'pending',
      invoiceNumber: saleData.invoiceNumber || '',
      tipoAccesorio: saleData.metadata?.tipoAccesorio || '',
      accesoriosItems: saleData.metadata?.accesoriosItems || [],
      descripcionConsulta: saleData.metadata?.descripcionConsulta || '',
      fechaConsulta: saleData.metadata?.fechaConsulta || null,
      valorConsulta: saleData.metadata?.valorConsulta ?? null,
      rechargeable: saleData.metadata?.rechargeable || '',
      seguroPerdidaRobo: saleData.metadata?.seguroPerdidaRobo || '',
      seguroRotura: saleData.metadata?.seguroRotura || '',
      campaignId: saleData.metadata?.campaignId ?? null,
      campaignNombre: saleData.metadata?.campaignNombre || '',
      fabricante: saleData.metadata?.fabricante || '',
      campaignVigencia: saleData.metadata?.campaignVigencia || '',
      images: saleData.metadata?.images || [],
    },
  });
};

/**
 * Registra una adaptación
 * @param {string} patientEmail - Email del paciente
 * @param {Object} adaptationData - Datos de la adaptación
 * @returns {Object} {success: boolean, product: Object|null, error: string|null}
 */
export const recordAdaptation = (patientEmail, adaptationData) => {
  return addPatientProduct(patientEmail, {
    type: 'adaptation',
    productName: adaptationData.productName,
    brand: adaptationData.brand,
    model: adaptationData.model,
    category: adaptationData.category || 'hearing-aid',
    quantity: adaptationData.quantity || 1,
    status: 'adapted',
    adaptationDate: adaptationData.adaptationDate || new Date().toISOString().split('T')[0],
    notes: adaptationData.notes || '',
    relatedAppointmentId: adaptationData.relatedAppointmentId || null,
    metadata: {
      audiogram: adaptationData.audiogram || null,
      settings: adaptationData.settings || {},
      followUpDate: adaptationData.followUpDate || null,
    },
  });
};

/**
 * Actualiza un producto
 * @param {string} patientEmail - Email del paciente
 * @param {string} productId - ID del producto
 * @param {Object} updates - Campos a actualizar
 * @returns {Object} {success: boolean, product: Object|null, error: string|null}
 */
export const updateProduct = (patientEmail, productId, updates) => {
  const allProducts = getAllPatientProducts();
  if (!allProducts[patientEmail]) {
    return {
      success: false,
      product: null,
      error: 'Paciente no encontrado',
    };
  }

  const productIndex = allProducts[patientEmail].findIndex(p => p.id === productId);
  if (productIndex === -1) {
    return {
      success: false,
      product: null,
      error: 'Producto no encontrado',
    };
  }

  allProducts[patientEmail][productIndex] = {
    ...allProducts[patientEmail][productIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (saveProducts(allProducts)) {
    return {
      success: true,
      product: allProducts[patientEmail][productIndex],
      error: null,
    };
  } else {
    return {
      success: false,
      product: null,
      error: 'Error al actualizar el producto',
    };
  }
};

/**
 * Convierte una cotización en una venta
 * @param {string} patientEmail - Email del paciente
 * @param {string} quoteId - ID de la cotización
 * @param {Object} saleData - Datos adicionales de la venta (fecha adaptación, primer mantenimiento, etc.)
 * @returns {Object} {success: boolean, sale: Object|null, error: string|null}
 */
export const convertQuoteToSale = (patientEmail, quoteId, saleData = {}) => {
  const allProducts = getAllPatientProducts();
  if (!allProducts[patientEmail]) {
    return {
      success: false,
      sale: null,
      error: 'Paciente no encontrado',
    };
  }

  const quoteIndex = allProducts[patientEmail].findIndex(p => p.id === quoteId && p.type === 'quote');
  if (quoteIndex === -1) {
    return {
      success: false,
      sale: null,
      error: 'Cotización no encontrada',
    };
  }

  const quote = allProducts[patientEmail][quoteIndex];
  
  // Crear la venta basada en la cotización
  const sale = {
    ...quote,
    id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Nuevo ID para la venta
    type: 'sale',
    status: 'completed',
    saleDate: saleData.saleDate || new Date().toISOString().split('T')[0],
    adaptationDate: saleData.adaptationDate || null,
    deliveryDate: saleData.deliveryDate || null,
    warrantyStartDate: saleData.warrantyStartDate || null,
    warrantyEndDate: saleData.warrantyEndDate || null,
    notes: saleData.notes || quote.notes || '',
    metadata: {
      ...quote.metadata,
      firstMaintenanceDate: saleData.firstMaintenanceDate || null,
      accessories: saleData.accessories || [],
      comments: saleData.comments || [],
      convertedFromQuoteId: quoteId, // Guardar referencia a la cotización original
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Agregar la venta
  allProducts[patientEmail].push(sale);
  
  // Eliminar la cotización original
  allProducts[patientEmail].splice(quoteIndex, 1);

  if (saveProducts(allProducts)) {
    return {
      success: true,
      sale,
      error: null,
    };
  } else {
    return {
      success: false,
      sale: null,
      error: 'Error al convertir la cotización en venta',
    };
  }
};

/**
 * Elimina un producto
 * @param {string} patientEmail - Email del paciente
 * @param {string} productId - ID del producto
 * @returns {Object} {success: boolean, error: string|null}
 */
export const deleteProduct = (patientEmail, productId) => {
  const allProducts = getAllPatientProducts();
  if (!allProducts[patientEmail]) {
    return {
      success: false,
      error: 'Paciente no encontrado',
    };
  }

  allProducts[patientEmail] = allProducts[patientEmail].filter(p => p.id !== productId);

  if (saveProducts(allProducts)) {
    return {
      success: true,
      error: null,
    };
  } else {
    return {
      success: false,
      error: 'Error al eliminar el producto',
    };
  }
};
