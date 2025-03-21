import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button } from 'react-bootstrap';
import './style/SidebarAndNavbarPage.css';
import util from '../../util/util';
import AddProductModal from '../modal/AddProductModal';
import AddTransactionModal from '../modal/AddTransactionModal';
import DeleteModal from '../modal/DeleteModal';
import NotifyModal from '../modal/NotifyModal';
import BoxAddTransaction from '../boxs/BoxAddTransaction';

function SidebarAndNavbarPage({
  ContentComponent,
  setDashboardVisible,
  setProductVisible,
  setTransactionVisible,
  setData,
  fetchData }) {
  // States for controlling the modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModalProduct, setshowAddModalProduct] = useState(false);
  const [showAddModalTransaction, setshowAddModalTransaction] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadButtonSize, setUploadButtonSize] = useState('btn-lg');
  const [showPropertyNavBar, setShowPropertyNavBar] = useState(false);

  const [namePage, setNamePage] = useState('Dashboard');

  const [addProductName, setAddProductName] = useState('');
  const [addProductPrice, setAddProductPrice] = useState('');
  const [addProductDetail, setAddProductDetail] = useState('');

  const [showNotify, setShowNotify] = useState(false);
  const [message, setMessage] = useState('');
  const [btnType, setBtnType] = useState('');

  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectedProductAddTransaction, setSelectedProductAddTransaction] = useState(new Set());

  const [isBtnLoading, setIsBtnLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('')
  // useEffect(() => {
  //   console.log(searchQuery)
  // }, [searchQuery])
  // Functions to open/close modals
  const handleDeleteShow = () => {
    if (namePage !== "Dashboard") {
      if (selectedRows.size === 0) {
        setShowNotify(true);
        setMessage("Please, Select item to delete.")
        setBtnType('warning')
      } else {
        setShowDeleteModal(true);
      }
    }
  }
  const handleDeleteClose = () => setShowDeleteModal(false);

  const handleAddShow = () => {
    if (namePage === 'All Product') {
      setshowAddModalProduct(true);
    }
    else if (namePage === 'All Transaction') {
      setshowAddModalTransaction(true);
    }
  };
  const handleAddClose = () => {
    setshowAddModalProduct(false);
    setshowAddModalTransaction(false);

    setImagePreview(null); // Reset image preview on close
    setUploadButtonSize('btn-lg'); // Reset button size on close

    setAddProductName("")
    setAddProductPrice("")
    setAddProductDetail("")

    setSelectedProductAddTransaction(new Set())
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setUploadButtonSize('btn-sm'); // Change button size after upload
    }
  };

  const handleDashboardPage = () => {
    setDashboardVisible(true);
    setProductVisible(false);
    setTransactionVisible(false);
    // setQuery('')
    // fetchData('');
    setNamePage('Dashboard')
    setShowPropertyNavBar(false);
  }
  const handleProductPage = () => {
    setDashboardVisible(false);
    setProductVisible(true);
    setTransactionVisible(false);
    // setQuery('products');
    fetchData('product/getproduct')
    setNamePage('All Product')
    setSelectedRows(new Set());
    setShowPropertyNavBar(true);
  }
  const handleTransactionPage = () => {
    setDashboardVisible(false);
    setProductVisible(false);
    setTransactionVisible(true);
    // setQuery('transactions');
    fetchData('customer/getcustomer')
    setNamePage('All Transaction')
    setShowPropertyNavBar(true);
    setSelectedRows(new Set());
    setSelectedProductAddTransaction(new Set())
  }

  const handleAddProduct = async () => {
    setIsBtnLoading(true);
    const response = await fetch(imagePreview);   // Fetch the image
    const blob = await response.blob();           // Convert response to a Blob

    const stringBase64 = await new Promise((resolve, reject) => {  // Await the Promise
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);  // Resolve with Base64 string
      reader.onerror = reject;  // Handle errors
      reader.readAsDataURL(blob);  // Convert Blob to Base64
    });
    const data = {
      name: addProductName,
      price: addProductPrice,
      detail: addProductDetail,
      product_img: stringBase64.split(",")[1],
    };

    try {
      const result = await util.fetchPost("product/addproduct", data);
      if (result && result.code === 201) {
        setMessage(result.message);
        handleAddClose()
        handleProductPage()
        setBtnType('success')
      } else {
        setMessage('Failed to add new product');
        setBtnType('warning')
      }
      setShowNotify(true);
    } catch (error) {
      console.error('Fetch Post Error:', error);
      // throw error;
    }
    setIsBtnLoading(false);
  }

  const handleAddTransaction = async () => {
    let customer_result = null;
    setIsBtnLoading(true)
    setShowNotify(true);
    setMessage('Adding new transaction')
    setBtnType('secondary')
    if (imagePreview !== null) {
      if (selectedProductAddTransaction.size > 0) {

        try {
          const base64String = imagePreview.split(",")[1]; // Assuming imagePreview is the image URL

          const data = {
            customer_img: base64String // Sending the Base64 string instead of the Blob
          };

          customer_result = await util.fetchPost('customer/addcustomer', data);
        } catch (error) {
          console.error('Error in handleAddTransaction:', error);
        }

        if (!customer_result) {
          setShowNotify(true);
          setMessage('No face detected in the image')
          setBtnType('warning')
        }
        else {
          const transaction_data = {
            customer_id: customer_result.detail['customer_id'],
            product_list: Array.from(selectedProductAddTransaction).map(item => {
              return {
                product_id: item.product_id,
                qty: item.quantity,
              }
            })
          }

          try {
            const result = await util.fetchPost('transaction/addtransaction', transaction_data)
            // console.log(result)
            if (result.code === 201) {
              setShowNotify(true);
              setMessage('customer_id ' + customer_result.detail['customer_id'] + ' added success')
              setBtnType('success')
              handleAddClose()
              handleTransactionPage()
            }
            else {
              setShowNotify(true);
              setMessage('Failed to add transaction')
              setBtnType('warning')
            }
          }
          catch (error) {
            console.error('Error in handleAddTransaction:', error);
          }
        }
      }
      else {
        setShowNotify(true);
        setMessage("Please select product at least 1 product");
        setBtnType('warning');
      }
    }
    else {
      setShowNotify(true);
      setMessage("Please insert image");
      setBtnType('warning');
    }
    setIsBtnLoading(false)
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);  // Update the state
    const trimmedQuery = query.trim();  // Use the updated query directly

    // console.log(trimmedQuery === '');
    if (trimmedQuery !== '') {
      const response = await util.fetchData(`product/searchproduct/?query=${trimmedQuery}`);
      // console.log(response);
      setData(response)
    } else {
      handleProductPage();  // Handle case when query is empty
    }
  };

  return (
    <div className="grid-container">
      {/* Sidebar */}
      <div className="custom-containersidebar">
        <ul className="nav flex-column">
          <li className="nav-item" onClick={handleDashboardPage}><span className="icon">🏠</span><a className="nav-link active">Dashboard</a></li>
          <li className="nav-item" onClick={handleProductPage}><span className="icon">📦</span><a className="nav-link">Products</a></li>
          <li className="nav-item" onClick={handleTransactionPage}><span className="icon">💳</span><a className="nav-link">Transactions</a></li>
        </ul>
      </div>

      {/* Navbar */}
      <div className="custom-containernavbar">
        <div className="navbar-header"><h1 className="navbar-title">{namePage}</h1></div>
        {showPropertyNavBar && (

          <div style={{
            display: "flex",
            flexDirection: "row",
            marginRight: "15%",
          }}>

            <div className="navbar-container-buttons">
              <button className="custom-btn me-3" onClick={handleDeleteShow}>Delete</button>
              <button className="custom-btn me-3" onClick={handleAddShow}>Add</button>
            </div>
            <div className="search-container">
              {namePage !== 'All Transaction' && (
                <input type="text" className="form-control" placeholder="Search..." value={searchQuery} onChange={e => {
                  handleSearch(e.target.value)
                }} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className='content-container'>
        <div className='container-fluid'>
          {React.cloneElement(ContentComponent, {
            selectedRows: selectedRows,
            setSelectedRows: setSelectedRows,
          })}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        showDeleteModal={showDeleteModal}
        handleDeleteClose={handleDeleteClose}
        selectedItem={selectedRows}
        col_name={namePage === 'All Product' ? 'product_id' : 'customer_id'}
        handlePage={namePage === 'All Product' ? handleProductPage : handleTransactionPage}
        path={namePage === 'All Product' ? 'product/deleteproduct' : 'customer/deletecustomer'}
      />

      {/* Add Item Modal */}
      {
        showAddModalProduct && (
          <AddProductModal
            handleAddClose={handleAddClose}
            imagePreview={imagePreview}
            handleFileChange={handleFileChange}
            setAddProductName={setAddProductName}
            setAddProductPrice={setAddProductPrice}
            setAddProductDetail={setAddProductDetail}
            addProductName={addProductName}
            addProductPrice={addProductPrice}
            addProductDetail={addProductDetail}
            handleAddProduct={handleAddProduct}
            uploadButtonSize={uploadButtonSize}
            isBtnLoading={isBtnLoading}
          />
        )
      }
      {
        showAddModalTransaction && (
          <AddTransactionModal
            handleAddClose={handleAddClose}
            imagePreview={imagePreview}
            setImagePreview={setImagePreview}
            handleFileChange={handleFileChange}
            uploadButtonSize={uploadButtonSize}
            handleAddTransaction={handleAddTransaction}
            selectedProductAddTransaction={selectedProductAddTransaction}
            setSelectedProductAddTransaction={setSelectedProductAddTransaction}
            isBtnLoading={isBtnLoading}
          />
        )
      }

      {
        <NotifyModal
          showModal={showNotify}
          setShowNotify={setShowNotify}
          message={message}
          btnType={btnType}
        />
      }
    </div >
  );
}

export default SidebarAndNavbarPage;
