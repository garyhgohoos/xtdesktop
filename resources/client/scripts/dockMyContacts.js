/*
 * This file is part of the xTuple ERP: PostBooks Edition, a free and
 * open source Enterprise Resource Planning software suite,
 * Copyright (c) 1999-2010 by OpenMFG LLC, d/b/a xTuple.
 * It is licensed to you under the Common Public Attribution License
 * version 1.0, the full text of which (including xTuple-specific Exhibits)
 * is available at www.xtuple.com/CPAL.  By using this software, you agree
 * to be bound by its terms.
 */

var _dockMycontacts;
var _contactList;

/*!
  Initializes the My Contacts dock widget and places it in the main window.
*/
function initDockMyCntcts()
{
  if (!privileges.check("ViewMyContactsDock"))
    return;

  _dockMycontacts = toolbox.loadUi("dockList").findChild("_dockList");
  _dockMycontacts.windowTitle = qsTr("My Contacts");
  _dockMycontacts.objectName = "_dockMycontacts";
  mainwindow.addDockWidget(0x8,_dockMycontacts);

  // Set columns on list
  _contactList = _dockMycontacts.findChild("_list");
  _contactList.objectName = "_contactList";
  _contactList.addColumn(qsTr("Name"), -1, Qt.AlignLeft  , true, "cntct_name" );
  _contactList.addColumn(qsTr("Account#"), XTreeWidget.itemColumn, Qt.AlignLeft, false, "crmacct_number");
  _contactList.addColumn(qsTr("Account Name"), -1, Qt.AlignLeft,  true, "crmacct_name");
  _contactList.addColumn(qsTr("Phone"), -1, Qt.AlignLeft, true, "cntct_phone" );
  _contactList.addColumn(qsTr("Email"), -1, Qt.AlignLeft, true, "cntct_email" );
  _contactList.addColumn(qsTr("Address"), -1, Qt.AlignLeft  , false, "addr_line1" );
  _contactList.addColumn(qsTr("City"), XTreeWidget.docTypeColumn, Qt.AlignLeft  , false, "addr_city" );
  _contactList.addColumn(qsTr("State"), XTreeWidget.orderColumn, Qt.AlignLeft  , false, "addr_state" );
  _contactList.addColumn(qsTr("Country"), XTreeWidget.orderColumn, Qt.AlignLeft  , false, "addr_country" );
  _contactList.addColumn(qsTr("Postal Code"), XTreeWidget.docTypeColumn, Qt.AlignLeft  , false, "addr_postalcode" );

  _dtTimer.timeout.connect(fillListMyCntcts);

  _contactList.itemSelected.connect(openWindowMyCntcts);
  _contactList["populateMenu(QMenu*,XTreeWidgetItem*,int)"]
    .connect(populateMenuMyCntcts);

  // Add to array to tabify later if need be
  _bottomAreaDocks[_bottomAreaDocks.length]=_dockMycontacts;

  _dockMycontacts.visibilityChanged.connect(fillListMyCntcts);

  if (!_hasSavedState)
    fillListMyCntcts();
}

/*!
  Fills the My Contacts list with Contacts owned by the current user.
*/
function fillListMyCntcts()
{
  if (!_dockMycontacts.visible)
    return;

  _contactList = mainwindow.findChild("_contactList");
  _contactList.populate(toolbox.executeDbQuery("desktop", "contacts"));
}

/*! 
  Opens the window associated with the selected item.
*/
function openWindowMyCntcts()
{
  // Make sure we can open the window
  if (!privilegeCheckMyCntcts())
    return;

  // Determine which contact to open
  params = new Object;
  params.cntct_id = _contactList.id();

  // Open the window and perform any special handling required
  var newdlg = toolbox.openWindow("contact");
  newdlg.set(params);
  newdlg.exec();
}

/*!
  Adds actions to \a pMenu, typically from a right click on My Contacts.
*/
function populateMenuMyCntcts(pMenu)
{
  var menuItem;

  menuItem = toolbox.menuAddAction(pMenu, _open, privilegeCheckMyCntcts());
  menuItem.triggered.connect(openWindowMyCntcts);
}

/*!
  Returns whether user has privileges to view My Contact detail.
*/
function privilegeCheckMyCntcts()
{
  return privileges.check("MaintainContacts") ||
         privileges.check("ViewContacts");
}