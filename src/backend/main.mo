import Map "mo:core/Map";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  // COMPONENTS
  include MixinStorage();

  // Stable variables preserved from previous deployment for upgrade compatibility.
  // DO NOT REMOVE -- removing stable vars requires an explicit migration function.
  stable var ADMIN_RECOVERY_TOKEN : Text = "vault-admin-2026";
  stable var accessControlState = AccessControl.initState();

  // Custom Data & Functions

  type FileId = Text;
  type FolderId = Text;
  type Timestamp = Int;

  type MediaFile = {
    id : FileId;
    name : Text;
    size : Nat;
    mimeType : Text;
    folderId : ?FolderId;
    tags : [Text];
    isPublic : Bool;
    blob : Storage.ExternalBlob;
    createdAt : Timestamp;
    description : ?Text;
  };

  type MediaFolder = {
    id : FolderId;
    name : Text;
    parentId : ?FolderId;
    createdAt : Timestamp;
  };

  module File {
    public func compare(file1 : MediaFile, file2 : MediaFile) : Order.Order {
      Text.compare(file1.name, file2.name);
    };
  };

  stable var files = Map.empty<FileId, MediaFile>();
  stable var folders = Map.empty<FolderId, MediaFolder>();

  // Stable admin principal - persists across all upgrades.
  // The first authenticated caller to invoke claimAdminWithIdentity becomes
  // the permanent admin. This value is never reset by code changes.
  stable var adminPrincipal : ?Principal = null;

  func isAdminCaller(caller : Principal) : Bool {
    if (caller.isAnonymous()) { return false };
    switch (adminPrincipal) {
      case (?p) { p == caller };
      case null { false };
    };
  };

  // Called automatically on first authenticated login.
  // First non-anonymous caller becomes admin permanently.
  // Returns true if this caller is (or just became) admin.
  public shared ({ caller }) func claimAdminWithIdentity() : async Bool {
    if (caller.isAnonymous()) { return false };
    switch (adminPrincipal) {
      case (?p) { return p == caller };
      case null {
        adminPrincipal := ?caller;
        return true;
      };
    };
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    isAdminCaller(caller);
  };

  // File Operations

  public shared ({ caller }) func createFileRecord(id : FileId, name : Text, size : Nat, mimeType : Text, folderId : ?FolderId, tags : [Text], blob : Storage.ExternalBlob, description : ?Text) : async () {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can create files");
    };
    let file : MediaFile = {
      id;
      name;
      size;
      mimeType;
      folderId;
      tags;
      isPublic = false;
      blob;
      createdAt = Time.now();
      description;
    };
    files.add(id, file);
  };

  public shared ({ caller }) func deleteFile(id : FileId) : async () {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete files");
    };
    switch (files.get(id)) {
      case null { Runtime.trap("File does not exist") };
      case (?_) { files.remove(id) };
    };
  };

  public shared ({ caller }) func renameFile(id : FileId, newName : Text) : async () {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can rename files");
    };
    let file = switch (files.get(id)) {
      case (?f) { f };
      case null { Runtime.trap("File does not exist") };
    };
    let updatedFile = { file with name = newName };
    files.add(id, updatedFile);
  };

  public shared ({ caller }) func moveFileToFolder(fileId : FileId, folderId : ?FolderId) : async () {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can move files");
    };
    let file = switch (files.get(fileId)) {
      case (?f) { f };
      case null { Runtime.trap("File does not exist") };
    };
    let updatedFile = { file with folderId };
    files.add(fileId, updatedFile);
  };

  public shared ({ caller }) func updateFileTags(id : FileId, newTags : [Text]) : async () {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can update file tags");
    };
    let file = switch (files.get(id)) {
      case (?f) { f };
      case null { Runtime.trap("File does not exist") };
    };
    let updatedFile = { file with tags = newTags };
    files.add(id, updatedFile);
  };

  // Explicitly set a file's public/private status.
  // Returns empty string on success, error message on failure.
  public shared ({ caller }) func setFilePublic(id : FileId, isPublic : Bool) : async Text {
    if (not isAdminCaller(caller)) {
      return "Unauthorized: Only admins can change file visibility";
    };
    let file = switch (files.get(id)) {
      case (?f) { f };
      case null { return "File does not exist" };
    };
    let updatedFile = { file with isPublic };
    files.add(id, updatedFile);
    return "";
  };

  public shared ({ caller }) func toggleFilePublic(id : FileId) : async () {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can toggle file visibility");
    };
    let file = switch (files.get(id)) {
      case (?f) { f };
      case null { Runtime.trap("File does not exist") };
    };
    let updatedFile = { file with isPublic = not file.isPublic };
    files.add(id, updatedFile);
  };

  // Folder Operations

  public shared ({ caller }) func createFolder(id : Text, name : Text, parentId : ?Text) : async () {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can create folders");
    };
    let folder : MediaFolder = {
      id;
      name;
      parentId;
      createdAt = Time.now();
    };
    folders.add(id, folder);
  };

  public shared ({ caller }) func renameFolder(id : Text, newName : Text) : async () {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can rename folders");
    };
    let folder = switch (folders.get(id)) {
      case (?f) { f };
      case null { Runtime.trap("Folder does not exist") };
    };
    let updatedFolder = { folder with name = newName };
    folders.add(id, updatedFolder);
  };

  public shared ({ caller }) func deleteFolder(id : Text) : async () {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete folders");
    };
    if (not folders.containsKey(id)) {
      Runtime.trap("Folder does not exist");
    };
    folders.remove(id);
    // Move files in this folder to root
    let toUpdate = Map.empty<FileId, MediaFile>();
    for ((fileId, file) in files.entries()) {
      switch (file.folderId) {
        case (?fId) {
          if (fId == id) {
            toUpdate.add(fileId, { file with folderId = null });
          };
        };
        case (_) {};
      };
    };
    for ((fileId, updatedFile) in toUpdate.entries()) {
      files.add(fileId, updatedFile);
    };
  };

  // PUBLIC QUERIES

  // Returns file if: caller is admin, OR file.isPublic is true
  public query ({ caller }) func getFileById(id : FileId) : async ?MediaFile {
    switch (files.get(id)) {
      case (?file) {
        if (file.isPublic or isAdminCaller(caller)) {
          ?file;
        } else {
          null;
        };
      };
      case (null) { null };
    };
  };

  public query ({ caller }) func getFolderById(id : Text) : async ?MediaFolder {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can view folders");
    };
    folders.get(id);
  };

  public query ({ caller }) func listAllFiles() : async [MediaFile] {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can list all files");
    };
    files.values().toArray().sort();
  };

  public query ({ caller }) func getFilesByFolder(folderId : Text) : async [MediaFile] {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can filter files by folder");
    };
    files.values().toArray().filter(func(file) { switch (file.folderId) {
      case (?fId) { fId == folderId };
      case (_) { false };
    } });
  };

  public query ({ caller }) func getFilesByMimeType(mimeTypePrefix : Text) : async [MediaFile] {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can filter files by mime type");
    };
    files.values().toArray().filter(func(file) { file.mimeType.startsWith(#text(mimeTypePrefix)) });
  };

  public query ({ caller }) func searchFilesByTag(tag : Text) : async [MediaFile] {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can search files by tag");
    };
    files.values().toArray().filter(func(file) { file.tags.find(func(t) { t == tag }) != null });
  };

  public query ({ caller }) func getPublicFiles() : async [MediaFile] {
    files.values().toArray().filter(func(file) { file.isPublic });
  };

  public query ({ caller }) func listAllFolders() : async [MediaFolder] {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can list all folders");
    };
    folders.values().toArray();
  };
};
