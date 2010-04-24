/*
 * This file is part of the xTuple ERP: PostBooks Edition, a free and
 * open source Enterprise Resource Planning software suite,
 * Copyright (c) 1999-2010 by OpenMFG LLC, d/b/a xTuple.
 * It is licensed to you under the Common Public Attribution License
 * version 1.0, the full text of which (including xTuple-specific Exhibits)
 * is available at www.xtuple.com/CPAL.  By using this software, you agree
 * to be bound by its terms.
 */

var _b1PurchHist;
var _b2PurchHist;
var _dockPurchHist;
var _groupByPurchHist;
var _timeFramePurchHist;
var _typePurchHist;
var _labelPurchHist;
var _purchHist;

/*!
  Initializes Sales History dock widget and places it in the main window.
*/
function initDockPurchHist()
{
  if (!privileges.check("ViewPurchaseHistoryDock"))
    return;

  // Set up objects
  _dockPurchHist = toolbox.loadUi("dockListButton").findChild("_dockListButton");
  _dockPurchHist.windowTitle = qsTr("Purchase History");
  _dockPurchHist.objectName = "_dockPurchHist";
  mainwindow.addDockWidget(0x1, _dockPurchHist);

  _purchHist = _dockPurchHist.findChild("_list");
  _purchHist.objectName = "_purchHist";
  _b1PurchHist = _dockPurchHist.findChild("_button1");
  _b2PurchHist = _dockPurchHist.findChild("_button2");
  _labelPurchHist = _dockPurchHist.findChild("_label");

  // Set icons
  var iReload = new QIcon;
  iReload.addDbImage("reload_16");
  _b1PurchHist.icon = iReload;
  _b1PurchHist.text = "";
  _b1PurchHist.toolTip = qsTr("Reload");

  var iGear = new QIcon();
  iGear.addDbImage("gear_16");
  _b2PurchHist.icon = iGear;
  _b2PurchHist.text = "";
  _b2PurchHist.toolTip = qsTr("Preferences...");

  // Load local preferences
  loadPreferencesPurchHist();

  // Set columns on list
  setColumnsPurchHist();

  // Connect Signals and Slots
  _b1PurchHist.clicked.connect(fillListPurchHist);
  _b2PurchHist.clicked.connect(preferencesPurchHist);

  _dtTimer.timeout.connect(fillListPurchHist);
  mainwindow.purchaseOrderReceiptsUpdated.connect(fillListPurchHist);
  mainwindow.vouchersUpdated.connect(fillListPurchHist);

  _purchHist.itemSelected.connect(openWindowPurchHist);
  _purchHist["populateMenu(QMenu*,XTreeWidgetItem*,int)"]
    .connect(populateMenuPurchHist);

  _dockPurchHist.visibilityChanged.connect(fillListPurchHist);

  // Add to array to tabify later if need be
  _leftAreaDocks[_leftAreaDocks.length]=_dockPurchHist;

  // Hide this initially to reduce clutter
  _dockPurchHist.hide();
}

/*!
  Fills the list with sales history data based on parameters determined by
  sales history preferences.

  \sa preferencesPurchHist()
*/
function fillListPurchHist()
{
  if (!_dockPurchHist.visible)
    return;

  var timeFrame;
  var type;
  var params = getDatesPurchHist();
  params.nonInv = qsTr("Non-Inventory");

  if (_typePurchHist == "variances")
    params.variances = true;
  else
    params.receipts = true;
 
  if (_groupByPurchHist == "vend")
  {
    params.group_id = "vend_id";
    params.group_number = "vend_number";
    params.group_name = "vend_name";
  }
  else if (_groupByPurchHist == "item")
  {
    params.group_id = "item_id";
    params.group_number = "item_number";
    params.group_name = "item_descrip1";
  }
  else if (_groupByPurchHist == "agent")
  {
    params.group_id = "1";
    params.group_number = "pohead_agent_username";
    params.group_name = "usr_propername";
  }

  _purchHist.populate(toolbox.executeDbQuery("desktop","purchHist", params));

  if ("variances" in params)
    type = qsTr("Variances");
  else
    type = qsTr("Receipts");

  if (_timeFramePurchHist == "today")
    timeFrame = qsTr("Today");
  else if (_timeFramePurchHist == "week")
    timeFrame = qsTr("this Week");
  else if (_timeFramePurchHist == "month")
    timeFrame = qsTr("this Month");
  else if (_timeFramePurchHist == "year")
    timeFrame = qsTr("this Year");

  _labelPurchHist.text = type + " " + timeFrame;
}

/*!
  Returns an object with a list containing \a startDate and \a endDate
  that is used for fetching data and opening windows using the date range
  stored in local preferences.
 
  \sa preferencesPurchHist()
  \sa openWindowPurchHist()
  \sa fillListPurchHist()
*/
function getDatesPurchHist()
{
  var params = new Object;

  params.timeFrame = _timeFramePurchHist;
  params.interval = "1 " + _timeFramePurchHist;

  var q = toolbox.executeDbQuery("desktop", "getDates", params);

  if (q.first())
  {
    params.startDate = q.value("startDate");
    params.endDate = q.value("endDate");
  }

  return params;
}

/*! 
  Loads local Sales History preferences into memory.

  \sa preferencesPurchHist()
*/
function loadPreferencesPurchHist()
{
  // Load preferences
  _groupByPurchHist = preferences.value("desktop/purchHist/groupBy");
  _timeFramePurchHist = preferences.value("desktop/purchHist/timeFrame");
  _typePurchHist = preferences.value("desktop/purchHist/type")
  
  // Set to defaults if no values
  _groupByPurchHist = (_groupByPurchHist.length ? _groupByPurchHist : "vend");
  _timeFramePurchHist = (_timeFramePurchHist.length ? _timeFramePurchHist : "year");
  _typePurchHist = (_typePurchHist.length ? _typePurchHist : "receipts");
}

/*! 
  Opens the window associated with the selected item.
*/
function openWindowPurchHist()
{
  var ui;
  var params = getDatesPurchHist();
  params.run = true;

  // TO DO: Work it out so totals launch a window too
  if (_purchHist.id() == -1)
    return;
  
  // Make sure we can open the window
  if (!privilegeCheckPurchHist())
    return;

  // Determine which window to open
  if (_groupByPurchHist == "vend")
  {
    if (_typePurchHist == "variances")
      ui = "dspPoPriceVariancesByVendor";
    else
      ui = "dspPoItemReceivingsByVendor";
    params.cust_id = _purchHist.id();
  }
  else if (_groupByPurchHist == "item")
  {
    if (_purchHist.id() == -2)
    {
      QMessageBox.warning(mainwindow, qsTr("Unsupported Action"),
        qsTr("Drill down on Non-Inventory Items is not yet supported"));
      return;
    }
    if (_typePurchHist == "variances")
      ui = "dspPoPriceVariancesByItem";
    else
      ui = "dspPoItemReceivingsByItem";
    params.prodcat_id = _purchHist.id();
  }
  else if (_groupByPurchHist == "agent")
  {
    if (_typePurchHist == "variances")
      ui = "dspPoPriceVariancesByVendor";
    else
      ui = "dspPoItemReceivingsByDate";
    params.salesrep_id = _purchHist.id();
  }

  // Open the window and perform any special handling required
  toolbox.openWindow(ui);
  toolbox.lastWindow()._warehouse.setAll();
  if (_typePurchHist = "receipts")
  {
    toolbox.lastWindow().findChild("_showUnvouchered").forgetful = true;
    toolbox.lastWindow().findChild("_showUnvouchered").checked = true;   
  }
  if (_groupByPurchHist == "vend")
  {
    if (_typePurchHist == "variances")
      toolbox.lastWindow().findChild("_vendorGroup").setVendId(_purchHist.id());
    else
      toolbox.lastWindow().findChild("_vendor").setId(_purchHist.id());
  }
  else if (_groupByPurchHist == "item")
    toolbox.lastWindow().findChild("_item").setId(_purchHist.id());  
  else if (_groupByPurchHist == "agent")
  {
    toolbox.lastWindow().findChild("_selectedPurchasingAgent").checked = true;
    toolbox.lastWindow().findChild("_agent").code = 
      _purchHist.currentItem().rawValue("pohead_agent_username")
  }

  var dates = toolbox.lastWindow().findChild("_dates");
  dates.setStartDate(params.startDate);
  dates.setEndDate(params.endDate);
  toolbox.lastWindow().sFillList();
}

/*!
  Adds actions to \a pMenu, typically from a right click on sales history.
*/
function populateMenuPurchHist(pMenu)
{
  var menuItem;
  var enable = privilegeCheckPurchHist();

  menuItem = toolbox.menuAddAction(pMenu, _open, enable);
  menuItem.triggered.connect(openWindowPurchHist);
}

/*!
  Returns whether user has privileges to view Sales History detail.
*/
function privilegeCheckPurchHist()
{
  if (_typePurchHist == "variances")
    return privileges.check("ViewVendorPerformance");
  else if (_typePurchHist == "receipts")
    return privileges.check("ViewReceiptsReturns");
   
  return false;
}

/*! 
  Set up columns depending on local preferences.

  \sa preferencesPurchHist()
*/
function setColumnsPurchHist()
{
  _purchHist.columnCount = 0;

  if (_groupByPurchHist == "vend")
  {
    _purchHist.addColumn(qsTr("Vendor"),  -1, Qt.AlignLeft, true, "vend_number");
    _purchHist.addColumn(qsTr("Name"), -1, Qt.AlignLeft, false, "vend_name");
  }
  else if (_groupByPurchHist == "item")
  {
    _purchHist.addColumn(qsTr("Item Number"), -1, Qt.AlignLeft, true, "item_number");
    _purchHist.addColumn(qsTr("Description"), -1, Qt.AlignLeft, false, "item_descrip1");
  }
  else if (_groupByPurchHist == "agent")
  {
    _purchHist.addColumn(qsTr("Purch. Agent"),  -1, Qt.AlignLeft, true, "pohead_agent_username");
    _purchHist.addColumn(qsTr("Name"), -1, Qt.AlignLeft, false, "usr_propername");
  }

  _purchHist.addColumn(qsTr("Amount"), -1, Qt.AlignRight, true, "amount");
  _purchHist.addColumn(qsTr("Qty."), -1, Qt.AlignRight, false, "qty");
}

/*! 
  Launches the preferences window where the user can set sales data output preferences.
*/
function preferencesPurchHist()
{
  params = new Object;
  params.path = "desktop/purchHist";
  params.groupBy = _groupByPurchHist;
  params.timeFrame = _timeFramePurchHist;
  params.type = _typePurchHist;

  var newdlg = toolbox.openWindow("preferencesHistory", mainwindow,
                                  Qt.ApplicationModal, Qt.Dialog);
  toolbox.lastWindow().set(params);
  if (newdlg.exec())
  {
    loadPreferencesPurchHist();
    setColumnsPurchHist();
    fillListPurchHist();
  }
}





